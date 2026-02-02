import { seedCompanies } from './seed-data';

export interface Company {
  id: number;
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
  lead_score: number;
  status: string;
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
function calculateLeadScore(company: Omit<Company, 'id' | 'lead_score'>): number {
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

// In-memory database (seeded from seed-data)
const companies: Company[] = seedCompanies.map((c, index) => ({
  id: index + 1,
  name: c.name,
  kvk_number: c.kvk_number,
  sector: c.sector,
  subsector: c.subsector,
  size: c.size,
  employee_count: c.employee_count,
  revenue_estimate: c.revenue_estimate,
  city: c.city,
  province: c.province,
  address: c.address,
  postal_code: c.postal_code,
  website: c.website,
  email: c.email,
  phone: c.phone,
  description: c.description,
  is_government: c.is_government ?? false,
  is_enterprise: c.is_enterprise ?? false,
  is_tech: c.is_tech ?? false,
  lead_score: calculateLeadScore(c as any),
  status: c.status || 'new',
  notes: c.notes,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}));

// Get all companies with optional filtering
export function getCompanies(filters: SearchFilters = {}): Company[] {
  let result = [...companies];
  
  if (filters.query) {
    const q = filters.query.toLowerCase();
    result = result.filter(c => 
      c.name.toLowerCase().includes(q) ||
      (c.description?.toLowerCase().includes(q)) ||
      c.city.toLowerCase().includes(q)
    );
  }
  
  if (filters.sector) {
    result = result.filter(c => c.sector === filters.sector);
  }
  
  if (filters.size) {
    result = result.filter(c => c.size === filters.size);
  }
  
  if (filters.province) {
    result = result.filter(c => c.province === filters.province);
  }
  
  if (filters.city) {
    result = result.filter(c => c.city === filters.city);
  }
  
  if (filters.minScore !== undefined) {
    result = result.filter(c => c.lead_score >= filters.minScore!);
  }
  
  if (filters.status) {
    result = result.filter(c => c.status === filters.status);
  }
  
  if (filters.isGovernment) {
    result = result.filter(c => c.is_government);
  }
  
  if (filters.isEnterprise) {
    result = result.filter(c => c.is_enterprise);
  }
  
  if (filters.isTech) {
    result = result.filter(c => c.is_tech);
  }
  
  // Sort by lead score descending
  result.sort((a, b) => b.lead_score - a.lead_score);
  
  return result;
}

// Get a single company by ID
export function getCompanyById(id: number): Company | undefined {
  return companies.find(c => c.id === id);
}

// Insert a new company (in-memory only, won't persist across deployments)
export function insertCompany(company: Omit<Company, 'id' | 'lead_score' | 'created_at' | 'updated_at'>): number {
  const newId = Math.max(...companies.map(c => c.id)) + 1;
  const newCompany: Company = {
    ...company,
    id: newId,
    lead_score: calculateLeadScore(company as any),
    is_government: company.is_government ?? false,
    is_enterprise: company.is_enterprise ?? false,
    is_tech: company.is_tech ?? false,
    status: company.status || 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  companies.push(newCompany);
  return newId;
}

// Update a company
export function updateCompany(id: number, updates: Partial<Company>): boolean {
  const index = companies.findIndex(c => c.id === id);
  if (index === -1) return false;
  
  const existing = companies[index];
  const merged = { ...existing, ...updates };
  merged.lead_score = calculateLeadScore(merged as any);
  merged.updated_at = new Date().toISOString();
  companies[index] = merged;
  
  return true;
}

// Delete a company
export function deleteCompany(id: number): boolean {
  const index = companies.findIndex(c => c.id === id);
  if (index === -1) return false;
  companies.splice(index, 1);
  return true;
}

// Get unique values for filters
export function getFilterOptions() {
  const sectors = [...new Set(companies.map(c => c.sector))].sort();
  const provinces = [...new Set(companies.map(c => c.province))].sort();
  const cities = [...new Set(companies.map(c => c.city))].sort();
  const sizes = ['micro', 'small', 'medium', 'large', 'enterprise'];
  const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
  
  return { sectors, provinces, cities, sizes, statuses };
}

// Get statistics
export function getStats() {
  const total = companies.length;
  
  const statusCounts: Record<string, number> = {};
  const sectorCounts: Record<string, number> = {};
  
  for (const c of companies) {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;
    sectorCounts[c.sector] = (sectorCounts[c.sector] || 0) + 1;
  }
  
  const byStatus = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
  const bySector = Object.entries(sectorCounts)
    .map(([sector, count]) => ({ sector, count }))
    .sort((a, b) => b.count - a.count);
  
  const avgScore = Math.round(companies.reduce((sum, c) => sum + c.lead_score, 0) / total);
  const highValue = companies.filter(c => c.lead_score >= 70).length;
  
  return { total, byStatus, bySector, avgScore, highValue };
}

export default { getCompanies, getCompanyById, insertCompany, updateCompany, deleteCompany, getFilterOptions, getStats };
