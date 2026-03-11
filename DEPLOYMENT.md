# CBA Air Cargo System - Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL 15+ (for local development)

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/Lewis2070/cba-air-cargo-agent.git
cd cba-air-cargo-agent
```

### 2. Start with Docker Compose

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### 3. Access Services

| Service | URL | Default Login |
|---------|-----|---------------|
| Frontend | http://localhost:8080 | admin@cba.com / Admin@2026 |
| Backend API | http://localhost:3000/api | - |
| API Docs | http://localhost:3000/api/docs | - |
| AI Service | http://localhost:8000 | - |

## Development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your settings
npm run start:dev
```

### AI Service

```bash
cd ai-service
pip install -r requirements.txt
python api/main.py
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://cba_user:cba_pass@localhost:5432/cba_air_cargo
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

## Database

### Initialize Database

```bash
# Connect to postgres container
docker exec -it cba-postgres psql -U cba_user -d cba_air_cargo

# Run migrations
psql -f /app/database/schema.sql
```

## Troubleshooting

### Check logs
```bash
docker-compose logs -f [service_name]
```

### Restart service
```bash
docker-compose restart [service_name]
```

### Reset everything
```bash
docker-compose down -v
docker-compose up -d
```

## Default Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cba.com | Admin@2026 |

## License

MIT
