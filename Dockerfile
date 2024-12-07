# Base image
FROM python:3.11

LABEL authors="aminedjeghri"

# Set environment variables
ENV APP_DIR=/generative-ai-project-template
# Set working directory
WORKDIR $APP_DIR

# Copy the necessary files for installation
COPY package.json ./
COPY package-lock.json ./
COPY Makefile ./
COPY .nvmrc ./


# Install system dependencies
RUN apt-get update && apt-get upgrade -y

# Install UV
RUN make install-uv

# Install NVM, Node.js and set up the environment
RUN make install-nvm
#RUN apt-get clean && apt-get autoremove --purge && apt-get autoremove

# Define default entrypoint if needed (Optional)
CMD ["/bin/bash"]
