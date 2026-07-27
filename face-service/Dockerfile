FROM python:3.13-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libgl1 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Replace GUI OpenCV with headless
RUN pip uninstall -y opencv-python || true
RUN pip install --no-cache-dir opencv-python-headless==4.13.0.92

COPY . .

EXPOSE 5001

CMD ["python", "app.py"]