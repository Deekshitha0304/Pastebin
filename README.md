# Pastebin-Lite

A small "Pastebin"-like application where users can create text pastes and share links to view them. Pastes may optionally expire based on time (TTL) or view count limits.

## Project Description

This is a production-ready paste-sharing service built with Next.js, TypeScript, and PostgreSQL. Users can create text pastes with optional expiration constraints (time-based TTL or view-count limits) and receive shareable URLs. The application supports deterministic time testing for automated evaluation.

## How to Run Locally

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (local or Neon)
- Git

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Deekshitha0304/Pastebin.git
   cd Pastebin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env.local` file in the project root:
   ```env
   DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
   ```

4. **Run database migrations:**
   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open in browser:**
   Visit [http://localhost:3000](http://localhost:3000)

### Standard Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (automatically runs `prisma migrate deploy` before building)
- `npm start` - Start production server
- `npm test` - Run test suite
- `npx prisma studio` - Open database GUI

## Persistence Layer

**PostgreSQL (Neon)** - A cloud-hosted PostgreSQL database is used for persistence.

- **Why PostgreSQL:** Serverless-compatible, reliable, and supports complex queries
- **Why Neon:** Free tier available, serverless-compatible connection pooling, and works seamlessly with Vercel
- **Schema:** Single `Snippet` table with fields for content, expiration times, and view counts
- **Migrations:** Prisma migrations are included and run automatically on deployment

The database schema:
```prisma
model Snippet {
  id        String    @id
  content   String
  createdAt DateTime  @default(now())
  expiresAt DateTime?  // Optional TTL
  maxViews  Int?       // Optional view limit
  viewCount Int       @default(0)
  @@index([expiresAt])
}
```

## Important Design Decisions

### 1. API Route Structure
- **POST /api/pastes** - Create a new paste
- **GET /api/pastes/:id** - Fetch paste data (JSON)
- **GET /p/:id** - View paste as HTML
- **GET /api/healthz** - Health check endpoint

### 2. Expiration Logic
- **Time-based (TTL):** Expires after `ttl_seconds` from creation
- **View-based:** Expires after `max_views` views
- **Combined:** Paste becomes unavailable when **either** constraint triggers
- **All unavailable cases return 404** (not 410) per specification

### 3. TEST_MODE Support
When `TEST_MODE=1` environment variable is set:
- The `x-test-now-ms` header is treated as the current time for expiry logic
- Enables deterministic testing of time-based expiration
- Real system time is used if header is absent

### 4. Atomic View Counting
- Uses Prisma's atomic `increment` operation
- Prevents race conditions under concurrent load
- View count increments before checking limits

### 5. HTML Safety
- Paste content is HTML-escaped in `/p/:id` view
- Prevents script execution (XSS protection)
- Uses proper escaping for `<`, `>`, `&`, quotes

### 6. Serverless Architecture
- Next.js App Router with Route Handlers
- Prisma Client with singleton pattern for connection pooling
- No global mutable state
- Stateless API endpoints

## API Documentation

### Health Check
**GET /api/healthz**
- Returns: `{"ok": true}` or `{"ok": false, "error": "..."}`
- Status: 200
- Reflects database connectivity

### Create Paste
**POST /api/pastes**

Request body:
```json
{
  "content": "string (required)",
  "ttl_seconds": 60,      // Optional, integer ≥ 1
  "max_views": 5          // Optional, integer ≥ 1
}
```

Response (201):
```json
{
  "id": "string",
  "url": "https://your-app.vercel.app/p/<id>"
}
```

Error (400):
```json
{
  "error": "error message"
}
```

### Fetch Paste
**GET /api/pastes/:id**

Response (200):
```json
{
  "content": "string",
  "remaining_views": 4,        // null if unlimited
  "expires_at": "2026-01-01T00:00:00.000Z"  // null if no TTL
}
```

Unavailable (404):
```json
{
  "error": "Paste not found"
}
```

### View Paste (HTML)
**GET /p/:id**
- Returns HTML page with paste content
- Content is HTML-escaped for safety
- Returns 404 if paste is unavailable

## Deployment

### Vercel Deployment

1. **Connect GitHub repository** to Vercel
2. **Add environment variable:**
   - `DATABASE_URL` - Your Neon PostgreSQL connection string
3. **Deploy** - Vercel will automatically:
   - Install dependencies
   - Generate Prisma client (`postinstall` script)
   - Run database migrations (`prisma migrate deploy` in build script)
   - Build the application

### Production Database

The application uses Neon PostgreSQL for production persistence. Migrations are applied automatically during deployment.

## Testing

Run the test suite:
```bash
npm test
```

The application includes 15 integration tests covering:
- Paste creation with various configurations
- View limits and expiration
- Validation errors
- Atomic operations
- TEST_MODE support

## Repository Structure

```
pastebin/
├── app/
│   ├── api/
│   │   ├── healthz/route.ts      # Health check
│   │   └── pastes/
│   │       ├── route.ts          # POST /api/pastes
│   │       └── [id]/route.ts     # GET /api/pastes/:id
│   ├── p/[id]/page.tsx           # GET /p/:id (HTML view)
│   ├── s/[id]/page.tsx           # Enhanced UI view
│   ├── page.tsx                  # Home page
│   └── layout.tsx                # Root layout
├── lib/
│   ├── db.ts                     # Prisma client
│   └── utils.ts                  # Utilities
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Database migrations
└── __tests__/
    └── api/                      # Integration tests
```

## Notes

- **No hardcoded URLs** - All URLs are generated dynamically
- **No secrets in code** - All sensitive data in environment variables
- **Serverless-compatible** - No global mutable state
- **Automatic migrations** - Prisma migrations run on deployment
- **TEST_MODE support** - Enables deterministic time testing

---

**Deployed URL:** https://pastebin-orcin.vercel.app  
**Repository:** https://github.com/Deekshitha0304/Pastebin
