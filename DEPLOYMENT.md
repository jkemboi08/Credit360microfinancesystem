# Deployment Guide

## Prerequisites
- Node.js 18+ and npm 8+
- Supabase account and project
- Hosting service (Vercel, Netlify, etc.)

## Environment Setup

1. **Supabase Configuration**
   - Create a new Supabase project
   - Run database migrations from `src/database/migrations/`
   - Configure Row Level Security policies
   - Set up storage buckets

2. **Environment Variables**
   ```bash
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_APP_ENV=production
   ```

## Build Process

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build for Production**
   ```bash
   npm run build:prod
   ```

3. **Preview Build**
   ```bash
   npm run preview:prod
   ```

## Deployment Options

### Vercel
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build:prod`
3. Set publish directory: `dist`
4. Add environment variables

### Manual Deployment
1. Build the project: `npm run build:prod`
2. Upload `dist` folder contents to your web server
3. Configure your web server to serve the SPA

## Database Setup

1. **Run Migrations**
   - Execute SQL files in `src/database/migrations/`
   - Ensure all tables and relationships are created

2. **Configure RLS**
   - Set up Row Level Security policies
   - Configure tenant isolation
   - Set up user roles and permissions

3. **Seed Data**
   - Add initial configuration data
   - Set up default users and roles

## Security Considerations

- Ensure all environment variables are properly set
- Configure CORS settings in Supabase
- Set up proper RLS policies
- Enable HTTPS in production
- Regular security updates

## Monitoring

- Set up error tracking (Sentry, etc.)
- Monitor performance metrics
- Set up logging for critical operations
- Regular database backups
