# Pastebin Application

A production-ready, Pastebin-like web application built with Next.js, TypeScript, Prisma, and PostgreSQL. Share text snippets with automatic expiration based on time and view count.

## Features

- 📝 Create text snippets with unique shareable links
- ⏰ Time-based expiration (expires after a specific date/time)
- 👁️ View-based expiration (expires after a set number of views)
- 🔒 Atomic view counting (thread-safe, no race conditions)
- 🚀 Serverless-ready for Vercel deployment
- 💾 PostgreSQL database with Prisma ORM

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon compatible)
- **ORM:** Prisma
- **Styling:** CSS
- **Deployment:** Vercel

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (local or Neon)
- Git

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd pastebin
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# For Neon PostgreSQL
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# For local PostgreSQL
# DATABASE_URL="postgresql://user:password@localhost:5432/pastebin?schema=public"
```

**Getting a Neon Database:**
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Paste it as `DATABASE_URL` in your `.env` file

### 4. Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This will:
- Create the database schema
- Generate the Prisma Client

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure environment variables:
   - Add `DATABASE_URL` with your Neon connection string
5. Click "Deploy"

### 3. Run Migrations on Production

After deployment, run migrations:

```bash
npx prisma migrate deploy
```

Or set up automatic migrations by adding a build script in `package.json`:

```json
"scripts": {
  "build": "prisma migrate deploy && next build"
}
```

## API Documentation

### Create Snippet

**Endpoint:** `POST /api/snippets`

**Request Body:**
```json
{
  "content": "Your text content here",
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "maxViews": 10
}
```

**Success Response (201):**
```json
{
  "id": "abc123xyz",
  "url": "https://your-domain.com/s/abc123xyz"
}
```

**Error Response (400):**
```json
{
  "error": "Content cannot be empty"
}
```

### View Snippet

**Endpoint:** `GET /api/snippets/{id}`

**Success Response (200):**
```json
{
  "content": "Your text content here",
  "viewCount": 3,
  "expiresAt": "2024-12-31T23:59:59.000Z",
  "maxViews": 10
}
```

**Error Responses:**
- **404 Not Found:** Snippet does not exist
- **410 Gone:** Snippet has expired (time or views)

## Project Structure

```
pastebin/
├── app/
│   ├── api/
│   │   └── snippets/
│   │       ├── route.ts           # POST /api/snippets
│   │       └── [id]/
│   │           └── route.ts       # GET /api/snippets/[id]
│   ├── s/
│   │   └── [id]/
│   │       └── page.tsx           # Snippet view page
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page (create form)
│   └── globals.css                # Global styles
├── lib/
│   ├── db.ts                      # Prisma client singleton
│   └── utils.ts                   # Utility functions
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Database migrations
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Database Schema

```prisma
model Snippet {
  id        String   @id
  content   String
  createdAt DateTime @default(now())
  expiresAt DateTime
  maxViews  Int
  viewCount Int      @default(0)

  @@index([expiresAt])
}
```

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create and apply migrations

## Key Implementation Details

### Expiration Logic

Snippets expire when **either** condition is met:
1. Current time > `expiresAt`
2. `viewCount` >= `maxViews`

The API enforces this in the following order:
1. Check if snippet exists (404 if not)
2. Check time expiration (410 if expired)
3. Check view limit (410 if reached)
4. Atomically increment view count
5. Return snippet content

### Atomic View Counting

View counts are incremented atomically using Prisma's built-in atomic operations:

```typescript
await prisma.snippet.update({
  where: { id },
  data: {
    viewCount: { increment: 1 }
  }
})
```

This prevents race conditions when multiple users view the same snippet simultaneously.

### ID Generation

Snippets use short, URL-safe IDs generated with `nanoid`:
- 10 characters long
- URL-safe alphabet
- Collision-resistant

## Testing

To test the application:

1. **Create a snippet:**
   - Visit the home page
   - Enter content, expiry date, and max views
   - Submit the form

2. **View the snippet:**
   - Click the generated link
   - Refresh multiple times to increment view count

3. **Test expiration:**
   - Create a snippet with 1 max view
   - View it once
   - Try to view it again (should return 410)

## Troubleshooting

### Database Connection Issues

If you see "Can't reach database server":
- Verify `DATABASE_URL` is correct
- Check if your database is running
- For Neon, ensure `?sslmode=require` is in the connection string

### Build Errors

If Prisma Client is not found:
```bash
npx prisma generate
```

### Port Already in Use

If port 3000 is busy:
```bash
npm run dev -- -p 3001
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
