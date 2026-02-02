# Versis Lead Finder 🎯

Dutch Business Lead Generation Tool for the Versis Sales Team.

## Features

- 📊 **127+ Dutch Companies** - Pre-loaded database of enterprise, government, and tech companies
- 🔍 **Advanced Filtering** - Search by sector, size, location, and lead score
- 📈 **Lead Scoring** - Automatic scoring based on Versis target profile (enterprise, government, tech)
- 📥 **CSV Export** - Export filtered leads for CRM import
- ✏️ **CRUD Operations** - Add, edit, and delete companies
- 📋 **Status Tracking** - Track lead status through the sales pipeline

## Lead Scoring Algorithm

The lead score (0-100) is calculated based on:
- **Company Size**: Enterprise (30pts), Large (25pts), Medium (15pts), Small (5pts)
- **Government**: +25 points
- **Enterprise Flag**: +20 points
- **Tech Company**: +15 points
- **Sector**: Government (25pts), Finance/Healthcare/ICT (20pts), Energy/Industry (15pts), etc.
- **Employee Count**: 1000+ (10pts), 500+ (7pts), 100+ (4pts)

## Tech Stack

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling (Versis blue: #1d4ed8)
- **SQLite** - Local database (better-sqlite3)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/versis-systems/lead-finder.git
cd lead-finder

# Install dependencies
npm install

# Seed the database
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Companies

- `GET /api/companies` - List companies (with filters)
- `GET /api/companies?action=filters` - Get filter options
- `GET /api/companies?action=stats` - Get statistics
- `POST /api/companies` - Create company
- `GET /api/companies/[id]` - Get company by ID
- `PUT /api/companies/[id]` - Update company
- `DELETE /api/companies/[id]` - Delete company

### Export

- `GET /api/export` - Export filtered results to CSV

### Query Parameters (Filters)

- `q` - Search query (name, description, city)
- `sector` - Filter by sector
- `size` - Filter by size (micro, small, medium, large, enterprise)
- `province` - Filter by Dutch province
- `city` - Filter by city
- `minScore` - Minimum lead score (0-100)
- `status` - Filter by status (new, contacted, qualified, proposal, negotiation, won, lost)
- `isGovernment` - Only government organizations
- `isEnterprise` - Only enterprise companies
- `isTech` - Only tech companies

## Sectors

- Overheid (Government)
- Financiële dienstverlening (Financial Services)
- Gezondheidszorg (Healthcare)
- ICT & Technologie (ICT & Technology)
- Energie & Utilities (Energy & Utilities)
- Industrie & Productie (Industry & Manufacturing)
- Transport & Logistiek (Transport & Logistics)
- Zakelijke dienstverlening (Business Services)
- Bouw & Vastgoed (Construction & Real Estate)
- Onderwijs (Education)
- Retail & E-commerce (Retail & E-commerce)
- Horeca & Recreatie (Hospitality & Recreation)

## Data Storage

The application uses an **in-memory database** seeded from `src/lib/seed-data.ts`. This ensures Vercel serverless compatibility.

**Important**: Changes made through the admin panel persist only during a single deployment. To add permanent companies, edit `seed-data.ts` and redeploy.

## Adding Companies

1. Click **+ Add Company** in the header
2. Fill in company details
3. Classification (Government/Enterprise/Tech) affects lead score
4. Click **Add Company**

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Deploy

**Note**: For production with persistent data, consider using:
- Turso (SQLite in the cloud)
- PlanetScale
- Neon (Postgres)

### Environment Variables

None required for basic operation.

## Live Demo

🚀 **https://lead-finder-opal.vercel.app**

## GitHub Repository

📦 **https://github.com/openclaw-jarvis/versis-lead-finder**

## License

Internal tool for Versis Systems.

---

Built with ❤️ for the Versis Sales Team
