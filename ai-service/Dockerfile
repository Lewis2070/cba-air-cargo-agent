FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy AI models
COPY models/ ./models/

# Copy API
COPY api/ ./api/

# Expose port
EXPOSE 8000

# Run
CMD ["python", "-u", "api/main.py"]
