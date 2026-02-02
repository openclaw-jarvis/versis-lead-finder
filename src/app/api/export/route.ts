import { NextRequest, NextResponse } from 'next/server';
import { getCompanies, SearchFilters } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Build filters from query params
  const filters: SearchFilters = {};
  
  const query = searchParams.get('q');
  if (query) filters.query = query;
  
  const sector = searchParams.get('sector');
  if (sector) filters.sector = sector;
  
  const size = searchParams.get('size');
  if (size) filters.size = size;
  
  const province = searchParams.get('province');
  if (province) filters.province = province;
  
  const minScore = searchParams.get('minScore');
  if (minScore) filters.minScore = parseInt(minScore);
  
  const status = searchParams.get('status');
  if (status) filters.status = status;
  
  if (searchParams.get('isGovernment') === 'true') filters.isGovernment = true;
  if (searchParams.get('isEnterprise') === 'true') filters.isEnterprise = true;
  if (searchParams.get('isTech') === 'true') filters.isTech = true;
  
  const companies = getCompanies(filters);
  
  // Create CSV
  const headers = [
    'ID', 'Name', 'KVK', 'Sector', 'Size', 'Employees', 'City', 'Province',
    'Website', 'Email', 'Phone', 'Lead Score', 'Status', 'Government', 'Enterprise', 'Tech'
  ];
  
  const rows = companies.map(c => [
    c.id,
    `"${c.name}"`,
    c.kvk_number || '',
    `"${c.sector}"`,
    c.size,
    c.employee_count || '',
    `"${c.city}"`,
    `"${c.province}"`,
    c.website || '',
    c.email || '',
    c.phone || '',
    c.lead_score,
    c.status,
    c.is_government ? 'Yes' : 'No',
    c.is_enterprise ? 'Yes' : 'No',
    c.is_tech ? 'Yes' : 'No'
  ].join(','));
  
  const csv = [headers.join(','), ...rows].join('\n');
  
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="leads-export-${new Date().toISOString().split('T')[0]}.csv"`
    }
  });
}
