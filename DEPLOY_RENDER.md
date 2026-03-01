# How to Deploy NEET JEE Global on Render

Follow these steps to successfully deploy your application on Render.com:

### 1. Create a Web Service
- Connect your GitHub/GitLab repository to Render.
- Select **Web Service**.

### 2. Configure Build & Start Commands
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 3. Add Environment Variables
In the **Environment** tab of your Render dashboard, add the following variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your PostgreSQL connection string (e.g., from Render Blueprint or external DB) |
| `VITE_FIREBASE_API_KEY` | Your Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Your Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Your Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Your Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Your Firebase App ID |

### 4. Fix for "Exited with status 1"
The error in your screenshot (`Exited with status 1` at `dist/index.cjs:76`) is usually caused by a missing **`DATABASE_URL`**.
- Render requires a valid PostgreSQL database to start the server.
- If you don't have one, create a **PostgreSQL** instance on Render and copy its **Internal Database URL** into the `DATABASE_URL` environment variable of your Web Service.

### 5. Port Binding
Render automatically assigns a port. The application is already configured to listen on `process.env.PORT`, so it will bind correctly once the environment variables are set.
