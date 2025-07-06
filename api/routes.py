from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from schemas import User, Token, ProductCreate, ProductFormData, WidgetConfig
from database import UserDB, ProductDB, WidgetConfigDB
from auth import get_db, get_password_hash, authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta
from jose import jwt, JWTError
from fastapi import Request
import os
import uuid
from pathlib import Path
import shutil
from typing import List, Optional
import time
import asyncio

SECRET_KEY = os.environ.get("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

router = APIRouter(prefix="/api")

# Create artifacts directory if it doesn't exist
ARTIFACTS_DIR = Path("artifacts")
ARTIFACTS_DIR.mkdir(exist_ok=True)

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
    except JWTError:
        raise credentials_exception
    user = db.query(UserDB).filter(UserDB.username == username).first()
    if user is None:
        raise credentials_exception
    return user

async def save_uploaded_image(file: UploadFile) -> str:
    """Save uploaded image and return the URL"""
    if not file.content_type.startswith('image/'):
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
    db_user = UserDB(username=user.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    # Create widget config with random api_key for new user
    config_row = WidgetConfigDB(
        user_id=db_user.id,
        api_key=generate_api_key(db_user.id),
        config={}
    )
    db.add(config_row)
    db.commit()
    return {"msg": "User registered successfully"}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token = create_access_token(data={"sub": user.username}, expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
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
    current_user: UserDB = Depends(get_current_user)
):
    # Check for duplicate SKU for this user
    if db.query(ProductDB).filter(ProductDB.sku == sku, ProductDB.user_id == current_user.id).first():
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
        images=','.join(image_urls) if image_urls else None
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
        result.append({
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "price": p.price,
            "page_url": p.page_url,
            "category": p.category,
            "images": p.images.split(",") if p.images else []
        })
    return result

def generate_api_key(user_id: str) -> str:
    return f"vf_{user_id[:8]}_{uuid.uuid4().hex[:16]}"

@router.get("/widget/config")
def get_widget_config(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    config_row = db.query(WidgetConfigDB).filter(WidgetConfigDB.user_id == current_user.id).first()
    if not config_row:
        config_row = WidgetConfigDB(
            user_id=current_user.id,
            api_key=generate_api_key(current_user.id),
            config={}
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
    current_user: UserDB = Depends(get_current_user)
):
    config_row = db.query(WidgetConfigDB).filter(WidgetConfigDB.user_id == current_user.id).first()
    if config_row:
        config_row.config = config
        db.commit()
        db.refresh(config_row)
    else:
        config_row = WidgetConfigDB(
            user_id=current_user.id,
            api_key=generate_api_key(current_user.id),
            config=config
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
    """Get embed code for the current user's widget configuration"""
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
    
    return {
        "embed_code": embed_code,
        "api_key": api_key
    }

@router.post("/widget/regenerate-api-key")
def regenerate_api_key(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
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
            "uploadButtonText": "Upload a Photo"
        }
    return {"config": config, "api_key": config_row.api_key}

@router.get("/product/by-api-key")
def get_product_by_api_key(api_key: str, product_id: str, db: Session = Depends(get_db)):
    config_row = db.query(WidgetConfigDB).filter(WidgetConfigDB.api_key == api_key).first()
    if not config_row:
        raise HTTPException(status_code=404, detail="Invalid API key")
    user_id = config_row.user_id
    product = db.query(ProductDB).filter(ProductDB.id == product_id, ProductDB.user_id == user_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return {
        "id": product.id,
        "name": product.name,
        "sku": product.sku,
        "price": product.price,
        "page_url": product.page_url,
        "category": product.category,
        "images": product.images.split(",") if product.images else []
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
            "images": p.images.split(",") if p.images else []
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
    current_user: UserDB = Depends(get_current_user)
):
    product = db.query(ProductDB).filter(ProductDB.id == product_id, ProductDB.user_id == current_user.id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    # Check for duplicate SKU (exclude this product)
    if db.query(ProductDB).filter(ProductDB.sku == sku, ProductDB.user_id == current_user.id, ProductDB.id != product_id).first():
        raise HTTPException(status_code=400, detail="SKU already exists")
    # Save uploaded images
    image_urls = []
    for image in images:
        if image:
            image_url = await save_uploaded_image(image)
            image_urls.append(image_url)
    # If new images are uploaded, delete old images from disk if not referenced elsewhere
    if image_urls and product.images:
        old_images = product.images.split(',')
        for old_image in old_images:
            # Check if this image is referenced by any other product
            other = db.query(ProductDB).filter(ProductDB.images.like(f"%{old_image}%"), ProductDB.id != product_id).first()
            if not other:
                # Remove leading slash if present
                filename = old_image.split('/')[-1]
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
        product.images = ','.join(image_urls)
    db.commit()
    db.refresh(product)
    return {"msg": "Product updated successfully", "id": product.id}

@router.post("/generate-virtual-try-on-image")
async def generate_virtual_try_on_image(request: Request):
    """
    Simulate virtual try-on image generation.
    In production, this may take up to 20 seconds.
    For now, just sleep for 2 seconds and return the same image back.
    """
    data = await request.json()
    photo = data.get("photo")
    product_id = data.get("productId")
    # Simulate processing time
    await asyncio.sleep(2)
    # Return the same image as the result
    return {"resultImage": photo} 