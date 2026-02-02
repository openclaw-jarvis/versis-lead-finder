import { NextRequest, NextResponse } from 'next/server';
import { getCompanies, insertCompany, getFilterOptions, getStats, Company, SearchFilters } from '@/lib/db';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  // Check for special endpoints
  const action = searchParams.get('action');
  
  if (action === 'filters') {
    return NextResponse.json(getFilterOptions());
  }
  
  if (action === 'stats') {
    return NextResponse.json(getStats());
  }
  
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
  
  const city = searchParams.get('city');
  if (city) filters.city = city;
  
  const minScore = searchParams.get('minScore');
  if (minScore) filters.minScore = parseInt(minScore);
  
  const status = searchParams.get('status');
  if (status) filters.status = status;
  
  if (searchParams.get('isGovernment') === 'true') filters.isGovernment = true;
  if (searchParams.get('isEnterprise') === 'true') filters.isEnterprise = true;
  if (searchParams.get('isTech') === 'true') filters.isTech = true;
  
  const companies = getCompanies(filters);
  return NextResponse.json(companies);
}

export async function POST(request: NextRequest) {
  try {
    const company: Company = await request.json();
    const id = insertCompany(company);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}
