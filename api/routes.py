from fastapi import (
    APIRouter,
    HTTPException,
    Depends,
    status,
    UploadFile,
    File,
    Form,
    Body,
    Query,
    Header,
)
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from schemas import User, Token, CreditBalance, CreditInvoice
from database import UserDB, ProductDB, WidgetConfigDB, UsageLogDB, CreditPurchaseDB
from auth import (
    get_db,
    get_password_hash,
    authenticate_user,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from datetime import timedelta
from jose import jwt, JWTError
from fastapi import Request
import os
import uuid
from pathlib import Path
import shutil
from typing import List, Optional
import asyncio
import stripe
from datetime import datetime
from dateutil.relativedelta import relativedelta

SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

router = APIRouter(prefix="/api")

# Create artifacts directory if it doesn't exist
ARTIFACTS_DIR = Path("artifacts")
ARTIFACTS_DIR.mkdir(exist_ok=True)

# In-memory mock invoice storage (replace with DB in production)
credit_invoices = []

PAYPAL_CLIENT_ID = os.environ.get("PAYPAL_CLIENT_ID")
PAYPAL_CLIENT_SECRET = os.environ.get("PAYPAL_CLIENT_SECRET")
PAYPAL_ENV = os.environ.get("PAYPAL_ENV", "sandbox")
PAYPAL_API_BASE = (
    "https://api-m.sandbox.paypal.com" if PAYPAL_ENV == "sandbox" else "https://api-m.paypal.com"
)

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
FRONT_END_URL = os.environ.get("FRONT_END_URL")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET")

stripe.api_key = STRIPE_SECRET_KEY

# In-memory mapping for demo: session_id -> (username, credits, amount)
stripe_sessions = {}


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError as e:
        raise credentials_exception
    user = db.query(UserDB).filter(UserDB.username == username).first()
    if user is None:
        raise credentials_exception
    return user


async def save_uploaded_image(file: UploadFile) -> str:
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = ARTIFACTS_DIR / unique_filename

    # Save file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save image: {str(e)}")

    # Return the URL to access the image
    return f"/artifacts/{unique_filename}"


@router.get("/artifacts/{filename}")
async def serve_artifact(filename: str):
    file_path = ARTIFACTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@router.post("/register")
def register(user: User, db: Session = Depends(get_db)):
    existing_user = db.query(UserDB).filter(UserDB.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = get_password_hash(user.password)
    db_user = UserDB(username=user.username, hashed_password=hashed_password, credits=0)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    # Create widget config with random api_key for new user
    config_row = WidgetConfigDB(user_id=db_user.id, api_key=generate_api_key(db_user.id), config={})
    db.add(config_row)
    db.commit()
    return {"msg": "User registered successfully"}


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/products/add-single")
async def add_product(
    name: str = Form(...),
    sku: str = Form(...),
    price: Optional[float] = Form(None),
    page_url: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    images: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    # Check for duplicate SKU for this user
    if (
        db.query(ProductDB)
        .filter(ProductDB.sku == sku, ProductDB.user_id == current_user.id)
        .first()
    ):
        raise HTTPException(status_code=400, detail="SKU already exists")

    # Save uploaded images
    image_urls = []
    for image in images:
        if image:
            image_url = await save_uploaded_image(image)
            image_urls.append(image_url)

    # Create product
    db_product = ProductDB(
        user_id=current_user.id,
        name=name,
        sku=sku,
        price=price,
        page_url=page_url,
        category=category,
        images=",".join(image_urls) if image_urls else None,
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return {"msg": "Product added successfully", "id": db_product.id}


@router.get("/products")
def list_products(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    products = db.query(ProductDB).filter(ProductDB.user_id == current_user.id).all()
    result = []
    for p in products:
        result.append(
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "price": p.price,
                "page_url": p.page_url,
                "category": p.category,
                "images": p.images.split(",") if p.images else [],
            }
        )
    return result


def generate_api_key(user_id: str) -> str:
    return f"vf_{user_id[:8]}_{uuid.uuid4().hex[:16]}"


@router.get("/widget/config")
def get_widget_config(
    db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)
):
    config_row = db.query(WidgetConfigDB).filter(WidgetConfigDB.user_id == current_user.id).first()
    if not config_row:
        config_row = WidgetConfigDB(
            user_id=current_user.id, api_key=generate_api_key(current_user.id), config={}
        )
        db.add(config_row)
        db.commit()
        db.refresh(config_row)
    if not config_row.api_key:
        config_row.api_key = generate_api_key(current_user.id)
        db.commit()
        db.refresh(config_row)
    return {"config": config_row.config, "api_key": config_row.api_key}


@router.post("/widget/config")
def save_widget_config(
    config: dict,  # Accepts a dict directly
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    config_row = db.query(WidgetConfigDB).filter(WidgetConfigDB.user_id == current_user.id).first()
    if config_row:
        config_row.config = config
        db.commit()
        db.refresh(config_row)
    else:
        config_row = WidgetConfigDB(
            user_id=current_user.id, api_key=generate_api_key(current_user.id), config=config
        )
        db.add(config_row)
        db.commit()
        db.refresh(config_row)
    if not config_row.api_key:
        config_row.api_key = generate_api_key(current_user.id)
        db.commit()
        db.refresh(config_row)
    return {"config": config_row.config, "api_key": config_row.api_key}


@router.get("/widget/embed-code")
def get_embed_code(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    config = db.query(WidgetConfigDB).filter(WidgetConfigDB.user_id == current_user.id).first()

    if not config:
        raise HTTPException(status_code=404, detail="Widget configuration not found")

    # Generate API key (in a real app, this would be stored and retrieved)
    api_key = f"vf_{current_user.id[:8]}_{uuid.uuid4().hex[:16]}"

    embed_code = f"""<script src="https://cdn.virtualfit.com/widget.js"></script>
<script>
  VirtualFit.init({{
    apiKey: '{api_key}',
    config: {{
      primaryColor: '{config.primary_color}',
      secondaryColor: '{config.secondary_color}',
      backgroundColor: '{config.background_color}',
      textColor: '{config.text_color}',
      fontFamily: '{config.font_family}',
      fontSize: '{config.font_size}',
      fontWeight: '{config.font_weight}',
      buttonStyle: '{config.button_style}',
      buttonSize: '{config.button_size}',
      buttonText: '{config.button_text}',
      widgetSize: '{config.widget_size}',
      position: '{config.position}',
      title: '{config.title}',
      subtitle: '{config.subtitle}',
      callToAction: '{config.call_to_action}',
      showBranding: {config.show_branding.lower() == "true"},
      enableAR: {config.enable_ar.lower() == "true"},
      enableSharing: {config.enable_sharing.lower() == "true"},
      animationType: '{config.animation_type}',
      animationSpeed: '{config.animation_speed}'
    }},
    container: '#virtual-try-on-widget'
  }});
</script>"""

    return {"embed_code": embed_code, "api_key": api_key}


@router.post("/widget/regenerate-api-key")
def regenerate_api_key(
    db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)
):
    config = db.query(WidgetConfigDB).filter(WidgetConfigDB.user_id == current_user.id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Widget config not found")
    config.api_key = generate_api_key(current_user.id)
    db.commit()
    db.refresh(config)
    return {"api_key": config.api_key}


@router.get("/widget/config-by-api-key")
def get_widget_config_by_api_key(api_key: str, db: Session = Depends(get_db)):
    config_row = db.query(WidgetConfigDB).filter(WidgetConfigDB.api_key == api_key).first()
    if not config_row:
        raise HTTPException(status_code=404, detail="Widget config not found")
    config = config_row.config or {}
    if not config:
        # Default config
        config = {
            "primaryColor": "#667eea",
            "secondaryColor": "#ff6b6b",
            "backgroundColor": "#ffffff",
            "textColor": "#333333",
            "fontFamily": "Inter",
            "fontSize": "16px",
            "fontWeight": "500",
            "buttonStyle": "rounded",
            "buttonSize": "medium",
            "buttonText": "Take a Photo",
            "widgetSize": "medium",
            "position": "bottom-right",
            "title": "Virtual Try-On",
            "subtitle": "See how it looks on you",
            "callToAction": "Start your virtual fitting",
            "showBranding": True,
            "enableAR": True,
            "enableSharing": False,
            "animationType": "fade",
            "animationSpeed": "normal",
            "uploadButtonText": "Upload a Photo",
        }
    return {"config": config, "api_key": config_row.api_key}


@router.get("/product/by-api-key")
def get_product_by_api_key(api_key: str, product_id: str, db: Session = Depends(get_db)):
    config_row = db.query(WidgetConfigDB).filter(WidgetConfigDB.api_key == api_key).first()
    if not config_row:
        raise HTTPException(status_code=404, detail="Invalid API key")
    user_id = config_row.user_id
    product = (
        db.query(ProductDB).filter(ProductDB.id == product_id, ProductDB.user_id == user_id).first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": product.id,
        "name": product.name,
        "sku": product.sku,
        "price": product.price,
        "page_url": product.page_url,
        "category": product.category,
        "images": product.images.split(",") if product.images else [],
    }


@router.get("/demo/first-user-products")
def get_first_user_products(db: Session = Depends(get_db)):
    first_user = db.query(UserDB).order_by(UserDB.created_at).first()
    if not first_user:
        return {"api_key": None, "products": []}
    config_row = db.query(WidgetConfigDB).filter(WidgetConfigDB.user_id == first_user.id).first()
    api_key = config_row.api_key if config_row else None
    products = db.query(ProductDB).filter(ProductDB.user_id == first_user.id).all()
    product_list = [
        {
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "price": p.price,
            "page_url": p.page_url,
            "category": p.category,
            "images": p.images.split(",") if p.images else [],
        }
        for p in products
    ]
    return {"api_key": api_key, "products": product_list}


@router.put("/products/{product_id}")
async def update_product(
    product_id: str,
    name: str = Form(...),
    sku: str = Form(...),
    price: Optional[float] = Form(None),
    page_url: Optional[str] = Form(None),
    category: Optional[str] = Form(None),
    images: List[UploadFile] = File([]),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    product = (
        db.query(ProductDB)
        .filter(ProductDB.id == product_id, ProductDB.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # Check for duplicate SKU (exclude this product)
    if (
        db.query(ProductDB)
        .filter(
            ProductDB.sku == sku, ProductDB.user_id == current_user.id, ProductDB.id != product_id
        )
        .first()
    ):
        raise HTTPException(status_code=400, detail="SKU already exists")
    # Save uploaded images
    image_urls = []
    for image in images:
        if image:
            image_url = await save_uploaded_image(image)
            image_urls.append(image_url)
    # If new images are uploaded, delete old images from disk if not referenced elsewhere
    if image_urls and product.images:
        old_images = product.images.split(",")
        for old_image in old_images:
            # Check if this image is referenced by any other product
            other = (
                db.query(ProductDB)
                .filter(ProductDB.images.like(f"%{old_image}%"), ProductDB.id != product_id)
                .first()
            )
            if not other:
                # Remove leading slash if present
                filename = old_image.split("/")[-1]
                file_path = ARTIFACTS_DIR / filename
                if file_path.exists():
                    try:
                        os.remove(file_path)
                    except Exception as e:
                        print(f"Failed to delete old image {file_path}: {e}")
    # Update fields
    product.name = name
    product.sku = sku
    product.price = price
    product.page_url = page_url
    product.category = category
    if image_urls:
        product.images = ",".join(image_urls)
    db.commit()
    db.refresh(product)
    return {"msg": "Product updated successfully", "id": product.id}


def get_user_by_api_key(
    x_api_key: str = Header(None, alias="X-API-Key"), db: Session = Depends(get_db)
):
    print(f"[DEBUG] get_user_by_api_key: Received X-API-Key: {x_api_key}")
    if not x_api_key:
        print("[DEBUG] No API key provided in header.")
        return None
    config_row = db.query(WidgetConfigDB).filter(WidgetConfigDB.api_key == x_api_key).first()
    print(f"[DEBUG] WidgetConfigDB lookup result: {config_row}")
    if not config_row:
        print("[DEBUG] Invalid API key: not found in widget_configs table.")
        raise HTTPException(status_code=401, detail="Invalid API key")
    user = db.query(UserDB).filter(UserDB.id == config_row.user_id).first()
    print(f"[DEBUG] UserDB lookup result for user_id {config_row.user_id}: {user}")
    if not user:
        print("[DEBUG] User not found for API key.")
        raise HTTPException(status_code=401, detail="User not found for API key")
    return user


@router.post("/generate-virtual-try-on-image")
async def generate_virtual_try_on_image(
    request: Request, db: Session = Depends(get_db), user: UserDB = Depends(get_user_by_api_key)
):
    data = await request.json()
    photo = data.get("photo")
    product_id = data.get("productId")
    await asyncio.sleep(2)
    # Get credits per image from env variable (default 1)
    credits_per_image = int(os.environ.get("VTO_CREDITS_PER_IMAGE", 1))
    # Check if user has enough credits
    if user.credits < credits_per_image:
        raise HTTPException(status_code=402, detail="Not enough credits")
    # Deduct credits
    user.credits -= credits_per_image
    db.commit()
    # Log usage
    usage_log = UsageLogDB(user_id=user.id, credits_used=credits_per_image, action="generate_image")
    db.add(usage_log)
    db.commit()
    return {"resultImage": photo, "creditsLeft": user.credits}


@router.get("/credits", response_model=CreditBalance)
def get_credits(current_user: UserDB = Depends(get_current_user)):
    return {"credits": current_user.credits}


@router.get("/credits/invoices", response_model=List[CreditInvoice])
def get_credit_invoices(current_user: UserDB = Depends(get_current_user)):
    # Return only this user's invoices
    return [CreditInvoice(**inv) for inv in credit_invoices if inv["user"] == current_user.username]


@router.post("/stripe/create-checkout-session")
def create_stripe_checkout_session(
    amount: float = Body(...),
    credits: int = Body(...),
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    # Always look up or create Stripe customer by email (username)
    stripe_customers = stripe.Customer.list(email=current_user.username, limit=1)
    if stripe_customers.data:
        customer = stripe_customers.data[0]
    else:
        customer = stripe.Customer.create(email=current_user.username, name=current_user.username)
    # Stripe expects amount in cents
    amount_cents = int(amount * 100)
    success_url = f"{FRONT_END_URL}/subscription?status=success&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{FRONT_END_URL}/subscription?status=cancel"
    session = stripe.checkout.Session.create(
        customer=customer.id,
        payment_method_types=["card"],
        line_items=[
            {
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"{credits} Credits",
                        "description": f"Purchase of {credits} credits",
                    },
                    "unit_amount": amount_cents,
                },
                "quantity": 1,
            }
        ],
        mode="payment",
        success_url=success_url,
        cancel_url=cancel_url,
        payment_intent_data={"description": f"Purchase of {credits} credits"},
        metadata={"username": current_user.username, "credits": credits, "amount": amount},
    )
    # Store mapping for webhook
    stripe_sessions[session.id] = {
        "username": current_user.username,
        "credits": credits,
        "amount": amount,
    }
    return {"checkout_url": session.url}


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    event = None
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        print("[STRIPE WEBHOOK] Error:", e)
        raise HTTPException(status_code=400, detail="Invalid webhook")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        session_id = session["id"]
        metadata = session.get("metadata", {})
        username = metadata.get("username")
        credits = int(metadata.get("credits", 0))
        amount = float(metadata.get("amount", 0))
        payment_intent_id = session.get("payment_intent")
        print(
            f"[STRIPE WEBHOOK] Payment completed for user {username}, credits: {credits}, amount: {amount}"
        )
        # Find user and credit them
        user = db.query(UserDB).filter(UserDB.username == username).first()
        if user:
            user.credits += credits
            db.commit()
            # Log purchase in DB
            purchase = CreditPurchaseDB(
                user_id=user.id,
                stripe_session_id=session_id,
                stripe_charge_id=payment_intent_id,
                amount=amount,
                credits=credits,
                timestamp=datetime.utcnow(),
                description=f"Purchase of {credits} credits",
                status="succeeded",
                download_url=None,
            )
            db.add(purchase)
            db.commit()
        else:
            print(f"[STRIPE WEBHOOK] User not found: {username}")
    return {"status": "success"}


@router.get("/stripe/invoices", response_model=List[CreditInvoice])
def get_stripe_invoices(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    # Ensure we have the Stripe customer ID
    if not hasattr(current_user, "stripe_customer_id") or not current_user.stripe_customer_id:
        return []
    paid_invoices = stripe.Invoice.list(customer=current_user.stripe_customer_id, status="paid")
    invoices = []
    for invoice in paid_invoices.auto_paging_iter():
        date_iso = datetime.utcfromtimestamp(invoice.created).isoformat()
        invoices.append(
            CreditInvoice(
                id=invoice.id,
                date=date_iso,
                amount=(invoice.amount_paid or 0) / 100,
                status=invoice.status,
                description=invoice.description or "Stripe Invoice",
                downloadUrl=getattr(invoice, "invoice_pdf", None),
            )
        )
    return invoices


@router.get("/stripe/transactions", response_model=List[CreditInvoice])
def get_stripe_transactions(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
):
    # Always look up Stripe customer by email (username)
    stripe_customers = stripe.Customer.list(email=current_user.username, limit=1)
    if not stripe_customers.data:
        return []
    customer = stripe_customers.data[0]
    charges = stripe.Charge.list(customer=customer.id, paid=True)
    transactions = []
    for charge in charges.auto_paging_iter():
        full_charge = stripe.Charge.retrieve(charge.id)
        date_iso = datetime.utcfromtimestamp(full_charge.created).isoformat()
        transactions.append(
            CreditInvoice(
                id=full_charge.id,
                date=date_iso,
                amount=(full_charge.amount or 0) / 100,
                description=full_charge.description or "Stripe Charge",
                downloadUrl=full_charge.receipt_url,
            )
        )
    return transactions


@router.get("/usage/analytics")
def get_usage_analytics(
    db: Session = Depends(get_db),
    current_user: UserDB = Depends(get_current_user),
    period: str = Query("monthly", enum=["daily", "weekly", "monthly"]),
    start_date: str = Query(None),
    end_date: str = Query(None),
):
    now = datetime.utcnow()
    if end_date:
        end = datetime.fromisoformat(end_date)
    else:
        end = now
    if start_date:
        start = datetime.fromisoformat(start_date)
    else:
        if period == "daily":
            start = end - timedelta(days=6)
        elif period == "weekly":
            start = end - timedelta(weeks=5)
        else:
            start = (end.replace(day=1) - relativedelta(months=5)).replace(day=1)
    logs = (
        db.query(UsageLogDB)
        .filter(
            UsageLogDB.user_id == current_user.id,
            UsageLogDB.timestamp >= start,
            UsageLogDB.timestamp <= end,
        )
        .all()
    )
    # Get all credit purchases from DB for the selected period
    purchases = (
        db.query(CreditPurchaseDB)
        .filter(
            CreditPurchaseDB.user_id == current_user.id,
            CreditPurchaseDB.timestamp >= start,
            CreditPurchaseDB.timestamp <= end,
        )
        .all()
    )
    # Build period buckets
    usage_history = []
    balance_history = []
    buckets = []
    if period == "daily":
        for i in range((end - start).days + 1):
            day = start + timedelta(days=i)
            buckets.append(day.replace(hour=0, minute=0, second=0, microsecond=0))
    elif period == "weekly":
        week_start = (start - timedelta(days=start.weekday())).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        week_end = end
        buckets = []
        current = week_start
        while current <= week_end:
            buckets.append(current)
            current += timedelta(weeks=1)
    else:
        for i in range(6):
            month = (end.replace(day=1) - relativedelta(months=5 - i)).replace(day=1)
            buckets.append(month)
    # Calculate running balance
    running_balance = 0
    # Get all purchases and usages sorted by timestamp
    all_events = []
    for p in purchases:
        all_events.append({"timestamp": p.timestamp, "amount": p.credits, "type": "purchase"})
    for log in logs:
        all_events.append(
            {"timestamp": log.timestamp, "amount": -log.credits_used, "type": "usage"}
        )
    all_events.sort(key=lambda x: x["timestamp"])
    # For each bucket, sum all events up to and including that period
    for i, bucket in enumerate(buckets):
        if period == "daily":
            next_bucket = bucket + timedelta(days=1)
        elif period == "weekly":
            next_bucket = bucket + timedelta(weeks=1)
        else:
            next_bucket = (bucket + relativedelta(months=1)).replace(day=1)
        used = sum(log.credits_used for log in logs if bucket <= log.timestamp < next_bucket)
        usage_history.append(
            {
                "date": bucket.strftime("%Y-%m-%d")
                if period != "monthly"
                else bucket.strftime("%Y-%m"),
                "credits": int(used),
            }
        )
        # Calculate balance at the end of this period
        period_events = [e for e in all_events if e["timestamp"] < next_bucket]
        balance = sum(e["amount"] for e in period_events)
        balance_history.append(
            {
                "date": bucket.strftime("%Y-%m-%d")
                if period != "monthly"
                else bucket.strftime("%Y-%m"),
                "balance": balance,
            }
        )
    total_credits = int(sum(log.credits_used for log in logs))
    used_this_period = usage_history[-1]["credits"] if usage_history else 0
    avg = int(total_credits / len(usage_history)) if usage_history else 0
    # Calculate total money spent and total credits purchased for the period
    total_money = sum(p.amount for p in purchases)
    total_credits_purchased = sum(p.credits for p in purchases)
    cost_per_credit = total_money / total_credits_purchased if total_credits_purchased > 0 else 0
    return {
        "currentCredits": current_user.credits,
        "totalCredits": total_credits,
        "usedThisPeriod": used_this_period,
        "period": period,
        "usageHistory": usage_history,
        "balanceHistory": balance_history,
        "start": start.isoformat(),
        "end": end.isoformat(),
        "average": avg,
        "totalMoney": total_money,
        "totalCreditsPurchased": total_credits_purchased,
        "costPerCredit": cost_per_credit,
    }
