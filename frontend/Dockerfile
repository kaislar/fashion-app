FROM node:18-alpine
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./
RUN npm install

# Copy the rest of the app (including source code)
COPY . .

# Accept BACK_API_URL as a build argument and write it to .env
#ARG BACK_API_URL
#RUN echo "REACT_APP_BACK_API_URL=$BACK_API_URL" > .env
RUN cat .env

# Build the React app (this is where .env is used)
RUN npm run build

RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"] 