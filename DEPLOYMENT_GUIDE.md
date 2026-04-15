# Deployment Guide for Bhoh Chat App

This project is configured for a unified deployment (Backend serving the Frontend).

## Recommended Platform: Render

### 1. Create a New Web Service
- Connect your GitHub repository.
- Select the root directory.

### 2. Configure Settings
- **Runtime**: `Node`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

### 3. Environment Variables
Add the following in the Render Dashboard:
- `NODE_ENV`: `production`
- `MONGO_URI`: Your MongoDB Atlas Connection String
- `JWT_SECRET`: A random secret string

### 4. Database Setup
- If using MongoDB Atlas, make sure to **whitelist all IP addresses (0.0.0.0/0)** so Render can connect.

---

## Technical Details
- **Build Step**: Root `package.json` installs all dependencies and builds the Vite frontend into `frontend/dist`.
- **Start Step**: The Express server starts and serves `frontend/dist` as static files.
- **Routing**: Any non-API request is redirected to `index.html` to support React Router.
- **CORS**: Automatically allows the production domain.
