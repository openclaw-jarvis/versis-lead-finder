import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { seedCompanies } from '../src/lib/seed-data';

const dataDir = path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'leads.db');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Remove existing database
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    kvk_number TEXT UNIQUE,
    sector TEXT NOT NULL,
    subsector TEXT,
    size TEXT NOT NULL,
    employee_count INTEGER,
    revenue_estimate TEXT,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    address TEXT,
    postal_code TEXT,
    website TEXT,
    email TEXT,
    phone TEXT,
    description TEXT,
    is_government BOOLEAN DEFAULT 0,
    is_enterprise BOOLEAN DEFAULT 0,
    is_tech BOOLEAN DEFAULT 0,
    lead_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'new',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_sector ON companies(sector);
  CREATE INDEX IF NOT EXISTS idx_size ON companies(size);
  CREATE INDEX IF NOT EXISTS idx_city ON companies(city);
  CREATE INDEX IF NOT EXISTS idx_province ON companies(province);
  CREATE INDEX IF NOT EXISTS idx_lead_score ON companies(lead_score);
  CREATE INDEX IF NOT EXISTS idx_status ON companies(status);
`);

// Lead scoring function
function calculateLeadScore(company: typeof seedCompanies[0]): number {
  let score = 0;
  
  const sizeScores: Record<string, number> = {
    'enterprise': 30,
    'large': 25,
    'medium': 15,
    'small': 5,
    'micro': 0
  };
  score += sizeScores[company.size] || 0;
  
  if (company.is_government) score += 25;
  if (company.is_enterprise) score += 20;
  if (company.is_tech) score += 15;
  
  const sectorScores: Record<string, number> = {
    'Overheid': 25,
    'Financiële dienstverlening': 20,
    'Gezondheidszorg': 20,
    'ICT & Technologie': 20,
    'Energie & Utilities': 15,
    'Industrie & Productie': 15,
    'Transport & Logistiek': 12,
    'Zakelijke dienstverlening': 10,
    'Bouw & Vastgoed': 10,
    'Onderwijs': 10,
    'Retail & E-commerce': 8,
    'Horeca & Recreatie': 5
  };
  score += sectorScores[company.sector] || 5;
  
  if (company.employee_count) {
    if (company.employee_count >= 1000) score += 10;
    else if (company.employee_count >= 500) score += 7;
    else if (company.employee_count >= 100) score += 4;
  }
  
  return Math.min(score, 100);
}

// Insert seed data
const insertStmt = db.prepare(`
  INSERT INTO companies (
    name, kvk_number, sector, subsector, size, employee_count, revenue_estimate,
    city, province, address, postal_code, website, email, phone, description,
    is_government, is_enterprise, is_tech, lead_score, status, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let count = 0;
for (const company of seedCompanies) {
  const score = calculateLeadScore(company);
  
  insertStmt.run(
    company.name,
    company.kvk_number || null,
    company.sector,
    company.subsector || null,
    company.size,
    company.employee_count || null,
    company.revenue_estimate || null,
    company.city,
    company.province,
    company.address || null,
    company.postal_code || null,
    company.website || null,
    company.email || null,
    company.phone || null,
    company.description || null,
    company.is_government ? 1 : 0,
    company.is_enterprise ? 1 : 0,
    company.is_tech ? 1 : 0,
    score,
    company.status || 'new',
    company.notes || null
  );
  count++;
}

console.log(`✅ Seeded ${count} companies into the database`);
console.log(`📁 Database location: ${dbPath}`);

// Print some stats
const stats = db.prepare('SELECT COUNT(*) as total, AVG(lead_score) as avgScore FROM companies').get() as { total: number, avgScore: number };
const highValue = db.prepare('SELECT COUNT(*) as count FROM companies WHERE lead_score >= 70').get() as { count: number };

console.log(`\n📊 Statistics:`);
console.log(`   Total companies: ${stats.total}`);
console.log(`   Average lead score: ${Math.round(stats.avgScore)}`);
console.log(`   High-value leads (≥70): ${highValue.count}`);

db.close();
