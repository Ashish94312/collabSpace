# Setup Guide

This document provides detailed setup instructions and documents known configuration issues and their solutions.

## Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** database (v13 or higher recommended)
- **Git**
- **npm** or **yarn** package manager

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/collabspace.git
cd collabspace
```

### 2. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/collabspace"
JWT_SECRET="your-secret-key-change-this-in-production"
PORT=3000
```

**Important Notes:**
- Change `username` and `password` to your PostgreSQL credentials
- Generate a strong random string for `JWT_SECRET` in production
- Ensure PostgreSQL is running before continuing

#### Set Up Database

```bash
# Generate Prisma client
npx prisma generate

# Create database and tables
npx prisma db push

# (Optional) View database in Prisma Studio
npx prisma studio
```

#### Start Backend Server

```bash
npm start
```

The backend API should now be running on `http://localhost:3000`

### 3. Frontend Setup

#### Install Dependencies

```bash
cd ../frontend
npm install
```

**Known Issue - Security Vulnerabilities:**

During installation, you may see warnings about 12 vulnerabilities. These are primarily in development dependencies (react-scripts and related packages):

- 2 low severity
- 3 moderate severity
- 6 high severity
- 1 critical severity

**Resolution Options:**

1. **Safe fix** (non-breaking):
   ```bash
   npm audit fix
   ```

2. **Force fix** (may include breaking changes):
   ```bash
   npm audit fix --force
   ```
   
   ⚠️ **Warning:** This may downgrade `react-scripts` to version 0.0.0, which will break the build.

**Recommendation:** The vulnerabilities are in development dependencies and do not affect production builds. Monitor for updates to `react-scripts` or consider migrating to a modern build tool like Vite.

#### Start Frontend Development Server

```bash
npm start
```

The frontend should now be running on `http://localhost:3002`

### 4. Optional: Elasticsearch Setup

For document search functionality, set up Elasticsearch:

#### Using Docker

```bash
docker run -d \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  elasticsearch:7.15.0
```

#### Configure Backend

Add to your `backend/.env`:

```env
ELASTICSEARCH_NODE="http://localhost:9200"
```

## Known Issues and Solutions

### Issue 1: Missing `.env.example` File

**Problem:** The repository didn't include a `.env.example` template file.

**Solution:** A `.env.example` file has been created in the `backend` directory. Copy this file to create your `.env` configuration.

### Issue 2: Security Vulnerabilities in Frontend Dependencies

**Problem:** The frontend has 12 known vulnerabilities in dependencies, primarily in:
- `form-data` (critical)
- `nth-check` (high)
- `postcss` (moderate)
- `webpack-dev-server` (moderate)

**Solution:** These are development dependencies and don't affect production builds. Consider:
- Using `npm audit fix` for safe fixes
- Monitoring for updates to `react-scripts`
- Migrating to a modern build tool like Vite for future-proofing

### Issue 3: Placeholder URLs in Documentation

**Problem:** Documentation contained placeholder URLs (`yourusername`) and broken links to non-existent issue templates.

**Solution:** All placeholder URLs have been replaced or removed. Issue template references have been simplified.

### Issue 4: Missing Issue Templates

**Problem:** `CONTRIBUTING.md` referenced `.github/ISSUE_TEMPLATE/` files that don't exist.

**Solution:** References removed. Consider creating issue templates in the future:

```bash
mkdir -p .github/ISSUE_TEMPLATE
```

## Verification

### Test Backend

```bash
curl http://localhost:3000/api/validate-token
```

Expected response: Error message about missing token (this is normal)

### Test Frontend

Open `http://localhost:3002` in your browser. You should see the CollabSpace login/signup page.

### Test WebSocket

WebSocket connections are automatically established when you open a document in the editor.

## Database Management

### View Database

```bash
cd backend
npx prisma studio
```

This opens a web interface at `http://localhost:5555`

### Reset Database

```bash
cd backend
npx prisma db push --force-reset
```

⚠️ **Warning:** This will delete all data!

### Update Schema

After modifying `backend/prisma/schema.prisma`:

```bash
npx prisma generate
npx prisma db push
```

## Troubleshooting

### PostgreSQL Connection Issues

**Error:** "Can't reach database server"

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   psql -U postgres -c "SELECT version();"
   ```
2. Check your `DATABASE_URL` in `.env`
3. Ensure the database exists:
   ```bash
   createdb collabspace
   ```

### Port Already in Use

**Error:** "Port 3000 is already in use"

**Solutions:**
1. Change the `PORT` in `backend/.env`
2. Kill the process using the port:
   ```bash
   # Find the process
   lsof -i :3000
   # Kill it
   kill -9 <PID>
   ```

### Frontend Won't Start

**Error:** Various npm errors

**Solutions:**
1. Clear npm cache:
   ```bash
   npm cache clean --force
   ```
2. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## Next Steps

- Read [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines
- Review [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community standards
- Check the [README.md](README.md) for feature documentation
- Start building and testing features!

## Support

If you encounter issues not covered here:
1. Check existing GitHub issues
2. Open a new issue with:
   - Detailed description of the problem
   - Steps to reproduce
   - Your environment details (OS, Node version, etc.)
   - Relevant error messages or logs
