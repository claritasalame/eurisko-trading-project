FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 4000
CMD python -m alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 4000 --reload
