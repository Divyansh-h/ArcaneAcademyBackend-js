# Arcane Academy Backend

This is the microservices backend for Arcane Academy, built with Node.js, Express, TypeScript, and Docker.

## Architecture

- **Gateway** (`:8000`): Entry point for all API requests.
- **Auth Service** (`:3001`): Handles user registration and login (JWT).
- **User Service** (`:3002`): Manages user profiles (Note: In progress).
- **Grading Service** (`:3004`): Handles grading logic (Note: In progress).
- **PostgreSQL**: Primary database.

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose installed.

## Getting Started

### 1. Start the Application

Run the following command in the `backend` directory to build and start all services:

```bash
docker-compose up -d --build
```

This will:
- Build the shared library (`@arcane/shared`).
- Build detailed Docker images for Gateway and Services.
- Start PostgreSQL and all Node.js services.

### 2. Verify Status

Check if containers are running:

```bash
docker-compose ps
```

View logs (add `-f` to follow):

```bash
docker-compose logs -f
```

### 3. API Endpoints

**Health Checks:**
- Gateway: `http://localhost:8000/health`
- Auth Service: `http://localhost:8000/api/auth/health`

**Authentication:**
- **Register**: `POST http://localhost:8000/api/auth/register`
  ```json
  { "email": "user@test.com", "password": "password123" }
  ```
- **Login**: `POST http://localhost:8000/api/auth/login`
  ```json
  { "email": "user@test.com", "password": "password123" }
  ```

## Development

- **Shared Library**: Located in `services/shared`. If you make changes here, you must rebuild the services or the Docker images.
- **Environment Variables**: Defined in `docker-compose.yml`.

## Troubleshooting

- **Port Conflicts**: The database is exposed on host port `5433` to avoid conflicts with local Postgres instances.
- **Rebuild**: If you change code, run `docker-compose up -d --build` to apply changes.
