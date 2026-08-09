# Production Deployment Guide (Free-Tier & Zero-Cost Architecture)

This document provides a step-by-step procedure to deploy **Campus Infrastructure Intelligence** using a free-tier/zero-cost primary architecture.

---

## 1. Production Architecture Overview

```text
                         GitHub
                            │
              ┌─────────────┴─────────────┐
              │                           │
          Frontend                    Backend
          Next.js                     NestJS
              │                           │
           Vercel                     Render
                                          │
                               ┌──────────┴──────────┐
                               │                     │
                            Docker              PostgreSQL
                               │                     │
                            Render               Supabase
                               │
                         Socket.IO
                               │
                    ┌──────────┼──────────┐
                    │          │          │
                   AI        Email      Cloudinary
```

| Component | Target Service | Hosting Tier | Purpose |
|---|---|---|---|
| **Frontend** | **Vercel** | Free Hobby Tier | Next.js SSG/SSR client app |
| **Backend** | **Render** | Free Web Service Tier | NestJS Docker container & Socket.IO server |
| **Database** | **Supabase** | Free Tier (500MB Postgres) | Hosted PostgreSQL database with SSL |
| **Files & Media** | **Cloudinary** | Free Tier (25GB storage) | Asset images & issue media uploads |
| **AI Processing** | **Google Gemini / OpenAI** | Free Tier / Usage API | Server-side AI categorization & predictions |
| **Email SMTP** | **Gmail / SendGrid / Ethereal** | Free Tier | Automated email notification dispatches |

---

## 2. Step 1: Database Setup on Supabase

1. Sign up at [supabase.com](https://supabase.com) and create a new project (e.g. `campus-infra-prod`).
2. Retrieve your **PostgreSQL Connection String** from *Project Settings -> Database -> Connection String (URI)*:
   ```text
   postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?schema=public
   ```
3. Run database migrations from your local workspace to Supabase:
   ```bash
   DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?schema=public" npm run prisma:migrate --workspace=@campus-infra/database
   ```

---

## 3. Step 2: Backend Deployment on Render

1. Sign up at [render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository (`Ajin-Saju/campus-infrastructure-intelligence`).
4. Select **Docker** as the Environment.
5. Set Docker Build Context to root `.` and Dockerfile Path to `./Dockerfile`.
6. Configure environment variables in Render Dashboard:
   * `NODE_ENV`: `production`
   * `PORT`: `3001`
   * `DATABASE_URL`: `[Your Supabase PostgreSQL Connection String]`
   * `FRONTEND_URL`: `https://[your-app-name].vercel.app`
   * `JWT_ACCESS_SECRET`: `[Generate strong random secret]`
   * `JWT_REFRESH_SECRET`: `[Generate strong random secret]`
   * `GEMINI_API_KEY`: `[Your Gemini API Key]`
   * `CLOUDINARY_CLOUD_NAME`: `[Your Cloudinary Cloud Name]`
   * `CLOUDINARY_API_KEY`: `[Your Cloudinary API Key]`
   * `CLOUDINARY_API_SECRET`: `[Your Cloudinary API Secret]`
   * `SMTP_HOST`: `smtp.gmail.com`
   * `SMTP_PORT`: `587`
   * `SMTP_USER`: `[Your Email]`
   * `SMTP_PASS`: `[Your App Password]`
7. Deploy. Render will output your live Backend URL (e.g., `https://campus-backend.onrender.com`).

---

## 4. Step 3: Frontend Deployment on Vercel

1. Sign up at [vercel.com](https://vercel.com).
2. Click **Add New... -> Project** and import your GitHub repository.
3. Set **Root Directory** to `apps/frontend`.
4. Framework Preset: **Next.js**.
5. Configure Environment Variables in Vercel Dashboard:
   * `NEXT_PUBLIC_API_URL`: `https://campus-backend.onrender.com`
   * `NEXT_PUBLIC_WS_URL`: `https://campus-backend.onrender.com`
6. Click **Deploy**. Vercel will output your live Frontend URL (e.g., `https://campus-infra.vercel.app`).

---

## 5. Step 4: Verification & Smoke Testing

1. Open `https://campus-infra.vercel.app`.
2. Check `https://campus-backend.onrender.com/api/v1/health` in browser.
3. Test User Sign In & Registration.
4. Verify Real-time Socket.IO Connection (Notifications badge updates).
5. Upload an Asset Image to verify Cloudinary integration.
6. Trigger an AI Issue Analysis to verify server-side AI processing.

---

## 6. Free-Tier Awareness & Pricing Considerations

> [!NOTE]
> * **Render Free Tier**: Web services spin down after 15 minutes of inactivity. Initial request after sleep may take ~30 seconds (cold start).
> * **Supabase Free Tier**: Free databases pause after 1 week of inactivity. Sending regular queries keeps it active.
> * **Cloudinary Free Tier**: Includes 25 Monthly Credits (~25K transformations or 25GB storage).
> * **AWS Readiness**: If migrating to AWS in the future, deploy the backend to EC2/ECS, Database to RDS PostgreSQL, assets to S3, and frontend to CloudFront.
