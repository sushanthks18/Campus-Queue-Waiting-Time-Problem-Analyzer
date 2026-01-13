# Deploying to Vercel

Since this project uses a Python backend and a React frontend in a monorepo, I have configured it for Vercel deployment.

## Prerequisites
1.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2.  **MongoDB Atlas**: You need a cloud-hosted MongoDB database since Vercel does not host databases. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).

## Steps to Deploy

### 1. Install Vercel CLI
If you haven't already, install the Vercel CLI globally:
```bash
npm i -g vercel
```

### 2. Login to Vercel
```bash
npx vercel login
```

### 3. Deploy
Run the deploy command from the project root:
```bash
npx vercel
```
-   **Set up and deploy**: Follow the prompts (Select `Y` for existing project, Keep default settings).
-   **Production**: Use `npx vercel --prod` to push to production.

## Configuration (Important!)

After deployment or during setup, you **MUST** set the Environment Variables in the Vercel Dashboard (Settings > Environment Variables):

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `MONGO_URL` | `mongodb+srv://<user>:<password>@cluster...` | Your MongoDB Atlas Connection String |
| `JWT_SECRET` | `your-secret-key` | A secure random string for tokens |
| `DB_NAME` | `campus_queue_analyzer` | Database name (Optional) |

## What I Did
-   Created `vercel.json` to handle both Frontend and Backend builds.
-   Created `api/index.py` as the entry point for the Python serverless function.
-   Added `requirements.txt` to the root for dependency installation.
-   Configured the Frontend to use relative paths in production (`.env.production`).
