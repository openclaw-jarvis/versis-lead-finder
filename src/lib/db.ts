import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'leads.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('journal_mode = WAL');

// Initialize database schema
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

export interface Company {
  id?: number;
  name: string;
  kvk_number?: string;
  sector: string;
  subsector?: string;
  size: string;
  employee_count?: number;
  revenue_estimate?: string;
  city: string;
  province: string;
  address?: string;
  postal_code?: string;
  website?: string;
  email?: string;
  phone?: string;
  description?: string;
  is_government?: boolean;
  is_enterprise?: boolean;
  is_tech?: boolean;
  lead_score?: number;
  status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SearchFilters {
  query?: string;
  sector?: string;
  size?: string;
  province?: string;
  city?: string;
  minScore?: number;
  status?: string;
  isGovernment?: boolean;
  isEnterprise?: boolean;
  isTech?: boolean;
}

// Calculate lead score for Versis (enterprise, government, tech focus)
export function calculateLeadScore(company: Company): number {
  let score = 0;
  
  // Size scoring (Versis targets enterprise)
  const sizeScores: Record<string, number> = {
    'enterprise': 30,
    'large': 25,
    'medium': 15,
    'small': 5,
    'micro': 0
  };
  score += sizeScores[company.size] || 0;
  
  // Government bonus (big contracts)
  if (company.is_government) score += 25;
  
  // Enterprise flag bonus
  if (company.is_enterprise) score += 20;
  
  // Tech sector bonus (they understand value of IT solutions)
  if (company.is_tech) score += 15;
  
  // Sector scoring
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
  
  // Employee count bonus
  if (company.employee_count) {
    if (company.employee_count >= 1000) score += 10;
    else if (company.employee_count >= 500) score += 7;
    else if (company.employee_count >= 100) score += 4;
  }
  
  return Math.min(score, 100);
}

// Get all companies with optional filtering
export function getCompanies(filters: SearchFilters = {}): Company[] {
  let sql = 'SELECT * FROM companies WHERE 1=1';
  const params: any[] = [];
  
  if (filters.query) {
    sql += ' AND (name LIKE ? OR description LIKE ? OR city LIKE ?)';
    const q = `%${filters.query}%`;
    params.push(q, q, q);
  }
  
  if (filters.sector) {
    sql += ' AND sector = ?';
    params.push(filters.sector);
  }
  
  if (filters.size) {
    sql += ' AND size = ?';
    params.push(filters.size);
  }
  
  if (filters.province) {
    sql += ' AND province = ?';
    params.push(filters.province);
  }
  
  if (filters.city) {
    sql += ' AND city = ?';
    params.push(filters.city);
  }
  
  if (filters.minScore !== undefined) {
    sql += ' AND lead_score >= ?';
    params.push(filters.minScore);
  }
  
  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }
  
  if (filters.isGovernment) {
    sql += ' AND is_government = 1';
  }
  
  if (filters.isEnterprise) {
    sql += ' AND is_enterprise = 1';
  }
  
  if (filters.isTech) {
    sql += ' AND is_tech = 1';
  }
  
  sql += ' ORDER BY lead_score DESC, name ASC';
  
  const stmt = db.prepare(sql);
  return stmt.all(...params) as Company[];
}

// Get a single company by ID
export function getCompanyById(id: number): Company | undefined {
  const stmt = db.prepare('SELECT * FROM companies WHERE id = ?');
  return stmt.get(id) as Company | undefined;
}

// Insert a new company
export function insertCompany(company: Company): number {
  const score = calculateLeadScore(company);
  
  const stmt = db.prepare(`
    INSERT INTO companies (
      name, kvk_number, sector, subsector, size, employee_count, revenue_estimate,
      city, province, address, postal_code, website, email, phone, description,
      is_government, is_enterprise, is_tech, lead_score, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
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
  
  return result.lastInsertRowid as number;
}

// Update a company
export function updateCompany(id: number, company: Partial<Company>): boolean {
  const existing = getCompanyById(id);
  if (!existing) return false;
  
  const merged = { ...existing, ...company };
  const score = calculateLeadScore(merged as Company);
  
  const stmt = db.prepare(`
    UPDATE companies SET
      name = ?, kvk_number = ?, sector = ?, subsector = ?, size = ?,
      employee_count = ?, revenue_estimate = ?, city = ?, province = ?,
      address = ?, postal_code = ?, website = ?, email = ?, phone = ?,
      description = ?, is_government = ?, is_enterprise = ?, is_tech = ?,
      lead_score = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  
  stmt.run(
    merged.name,
    merged.kvk_number || null,
    merged.sector,
    merged.subsector || null,
    merged.size,
    merged.employee_count || null,
    merged.revenue_estimate || null,
    merged.city,
    merged.province,
    merged.address || null,
    merged.postal_code || null,
    merged.website || null,
    merged.email || null,
    merged.phone || null,
    merged.description || null,
    merged.is_government ? 1 : 0,
    merged.is_enterprise ? 1 : 0,
    merged.is_tech ? 1 : 0,
    score,
    merged.status || 'new',
    merged.notes || null,
    id
  );
  
  return true;
}

// Delete a company
export function deleteCompany(id: number): boolean {
  const stmt = db.prepare('DELETE FROM companies WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// Get unique values for filters
export function getFilterOptions() {
  const sectors = db.prepare('SELECT DISTINCT sector FROM companies ORDER BY sector').all() as { sector: string }[];
  const provinces = db.prepare('SELECT DISTINCT province FROM companies ORDER BY province').all() as { province: string }[];
  const cities = db.prepare('SELECT DISTINCT city FROM companies ORDER BY city').all() as { city: string }[];
  const sizes = ['micro', 'small', 'medium', 'large', 'enterprise'];
  const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  
  return {
    sectors: sectors.map(s => s.sector),
    provinces: provinces.map(p => p.province),
    cities: cities.map(c => c.city),
    sizes,
    statuses
  };
}

// Get statistics
export function getStats() {
  const total = (db.prepare('SELECT COUNT(*) as count FROM companies').get() as { count: number }).count;
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM companies GROUP BY status').all() as { status: string, count: number }[];
  const bySector = db.prepare('SELECT sector, COUNT(*) as count FROM companies GROUP BY sector ORDER BY count DESC').all() as { sector: string, count: number }[];
  const avgScore = (db.prepare('SELECT AVG(lead_score) as avg FROM companies').get() as { avg: number }).avg;
  const highValue = (db.prepare('SELECT COUNT(*) as count FROM companies WHERE lead_score >= 70').get() as { count: number }).count;
  
  return {
    total,
    byStatus,
    bySector,
    avgScore: Math.round(avgScore || 0),
    highValue
  };
}

export default db;
