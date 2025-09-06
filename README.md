# ObjectiveEval - Software Evaluation Platform

A comprehensive SaaS platform for evaluating software applications based on objective metrics including performance benchmarking, integration analysis, and reliability monitoring.

## Features

- **Performance Benchmarking**: Response time, load testing, stress testing, and reliability testing
- **Integration Analysis**: AI-powered documentation analysis and platform compatibility assessment
- **Reliability Monitoring**: Continuous uptime monitoring with SLA compliance tracking
- **Comparison Tools**: Side-by-side application performance comparisons
- **Export Capabilities**: CSV export for performance data and reports

## Tech Stack

- **Frontend**: React + TypeScript, Tailwind CSS, Shadcn/ui components
- **Backend**: Node.js + Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit OAuth with session management
- **AI Integration**: OpenAI GPT for documentation analysis

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_secret_key
   REPLIT_DOMAINS=your_domain
   OPENAI_API_KEY=your_openai_key
   ```

3. Push database schema:
   ```bash
   npm run db:push
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Deployment to Vercel

1. Push code to GitHub
2. Connect GitHub repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

## Environment Variables

Required for production deployment:

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption
- `REPLIT_DOMAINS`: Authorized domains for OAuth
- `OPENAI_API_KEY`: OpenAI API key for AI analysis
- `NODE_ENV`: Set to "production"

## Sample Applications

The platform includes realistic sample data from well-known services:
- GitHub API
- Stripe Payment API
- Google Maps API
- SendGrid Email API
- AWS S3 API

## License

MIT License