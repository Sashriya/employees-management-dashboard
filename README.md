# Employee Management System

A full-stack employee management application with React frontend and Node.js backend.

## Project structure

- `client/` - React frontend application
- `server/` - Express backend API

## Features

- User authentication (login/register)
- Employee CRUD operations
- Protected routes for authenticated users
- Local storage and API integration

## Prerequisites

- Node.js 18+ installed
- npm available
- MongoDB running locally or accessible via URI

## Local setup

### Backend

1. Open a terminal and navigate to `server/`:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the backend:
   ```bash
   npm run dev
   ```
### Frontend

1. Open a new terminal and navigate to `client/`:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React app:
   ```bash
   npm start
   ```

The frontend will run on `http://localhost:3000` by default.

## Docker

The repository contains Dockerfiles in both `client/` and `server/`.

### Build frontend Docker image
```bash
cd client
npm install
npm run docker:build
```

### Run frontend Docker container
```bash
cd client
npm run docker:run
```

> Note: The provided `server/docker-compose.yml` references `./backend` and may require updating to point to `../server` if used from the repository root.

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in and receive a token
- `GET /api/employees` - Get all employees
- `GET /api/employees/:id` - Get one employee
- `POST /api/employees` - Create a new employee
- `PUT /api/employees/:id` - Update an employee
- `DELETE /api/employees/:id` - Delete an employee

## Notes

- Ensure MongoDB is available before starting the server.
- The frontend expects the backend API at `http://localhost:5000` unless adjusted in the service configuration.
