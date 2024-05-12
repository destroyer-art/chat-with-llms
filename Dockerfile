# Use Python 3.11 slim image as a base to avoid manual installations
FROM python:3.11-slim as builder

# Set the working directory in the container
WORKDIR /app

# Install build dependencies
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Use pip wheel to build dependencies first
COPY Pipfile Pipfile.lock ./
# Use pipenv to lock the dependencies to a requirements.txt
RUN pip install pipenv && \
    pipenv requirements > requirements.txt

# Install Python dependencies in /.venv
RUN pip install -r requirements.txt

RUN python -c "import certifi; print(certifi.where())"

# Copy the rest of the code to the working directory
COPY . /app

# Expose port 8080
EXPOSE 8080

# Run the command to start uvicorn
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]