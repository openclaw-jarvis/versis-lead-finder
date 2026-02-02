'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Company {
  id: number;
  name: string;
  kvk_number?: string;
  sector: string;
  size: string;
  employee_count?: number;
  city: string;
  province: string;
  website?: string;
  email?: string;
  phone?: string;
  description?: string;
  is_government: boolean;
  is_enterprise: boolean;
  is_tech: boolean;
  lead_score: number;
  status: string;
}

interface FilterOptions {
  sectors: string[];
  provinces: string[];
  cities: string[];
  sizes: string[];
  statuses: string[];
}

interface Stats {
  total: number;
  avgScore: number;
  highValue: number;
  byStatus: { status: string; count: number }[];
  bySector: { sector: string; count: number }[];
}

export default function Home() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filters, setFilters] = useState<FilterOptions | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState('');
  const [size, setSize] = useState('');
  const [province, setProvince] = useState('');
  const [minScore, setMinScore] = useState('');
  const [status, setStatus] = useState('');
  const [isGovernment, setIsGovernment] = useState(false);
  const [isEnterprise, setIsEnterprise] = useState(false);
  const [isTech, setIsTech] = useState(false);
  
  // Selected companies for export
  const [selected, setSelected] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Load filter options and stats
    Promise.all([
      fetch('/api/companies?action=filters').then(r => r.json()),
      fetch('/api/companies?action=stats').then(r => r.json())
    ]).then(([filterData, statsData]) => {
      setFilters(filterData);
      setStats(statsData);
    });
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [query, sector, size, province, minScore, status, isGovernment, isEnterprise, isTech]);

  const loadCompanies = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (sector) params.set('sector', sector);
    if (size) params.set('size', size);
    if (province) params.set('province', province);
    if (minScore) params.set('minScore', minScore);
    if (status) params.set('status', status);
    if (isGovernment) params.set('isGovernment', 'true');
    if (isEnterprise) params.set('isEnterprise', 'true');
    if (isTech) params.set('isTech', 'true');
    
    const res = await fetch(`/api/companies?${params}`);
    const data = await res.json();
    setCompanies(data);
    setLoading(false);
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    if (selected.size === companies.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(companies.map(c => c.id)));
    }
  };

  const exportCSV = () => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (sector) params.set('sector', sector);
    if (size) params.set('size', size);
    if (province) params.set('province', province);
    if (minScore) params.set('minScore', minScore);
    if (status) params.set('status', status);
    if (isGovernment) params.set('isGovernment', 'true');
    if (isEnterprise) params.set('isEnterprise', 'true');
    if (isTech) params.set('isTech', 'true');
    
    window.location.href = `/api/export?${params}`;
  };

  const updateStatus = async (id: number, newStatus: string) => {
    await fetch(`/api/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    loadCompanies();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  const getSizeLabel = (size: string) => {
    const labels: Record<string, string> = {
      'enterprise': 'Enterprise (1000+)',
      'large': 'Large (250-999)',
      'medium': 'Medium (50-249)',
      'small': 'Small (10-49)',
      'micro': 'Micro (1-9)'
    };
    return labels[size] || size;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1d4ed8] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Versis Lead Finder</h1>
              <p className="text-blue-200">Dutch Business Lead Generation Tool</p>
            </div>
            <Link 
              href="/admin" 
              className="bg-white text-[#1d4ed8] px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              + Add Company
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-3xl font-bold text-[#1d4ed8]">{stats.total}</div>
              <div className="text-gray-600">Total Companies</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-3xl font-bold text-green-600">{stats.highValue}</div>
              <div className="text-gray-600">High-Value Leads (≥70)</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-3xl font-bold text-blue-600">{stats.avgScore}</div>
              <div className="text-gray-600">Avg Lead Score</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-3xl font-bold text-purple-600">{companies.length}</div>
              <div className="text-gray-600">Filtered Results</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold text-lg mb-4">Filters</h2>
              
              {/* Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Company name, city..."
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Sector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All Sectors</option>
                  {filters?.sectors.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Size</label>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All Sizes</option>
                  {filters?.sizes.map(s => (
                    <option key={s} value={s}>{getSizeLabel(s)}</option>
                  ))}
                </select>
              </div>

              {/* Province */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                <select
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All Provinces</option>
                  {filters?.provinces.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Min Score */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Lead Score: {minScore || '0'}
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={minScore || 0}
                  onChange={(e) => setMinScore(e.target.value === '0' ? '' : e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All Statuses</option>
                  {filters?.statuses.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Flags */}
              <div className="mb-4 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGovernment}
                    onChange={(e) => setIsGovernment(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Government Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnterprise}
                    onChange={(e) => setIsEnterprise(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Enterprise Only</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTech}
                    onChange={(e) => setIsTech(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Tech Companies</span>
                </label>
              </div>

              {/* Export Button */}
              <button
                onClick={exportCSV}
                className="w-full bg-[#1d4ed8] text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                📥 Export to CSV
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="col-span-3">
            <div className="bg-white rounded-lg shadow">
              {/* Table Header */}
              <div className="px-4 py-3 border-b flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.size === companies.length && companies.length > 0}
                      onChange={selectAll}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-600">Select All</span>
                  </label>
                  {selected.size > 0 && (
                    <span className="text-sm text-[#1d4ed8] font-medium">
                      {selected.size} selected
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Showing {companies.length} results
                </div>
              </div>

              {/* Company List */}
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : companies.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No companies found</div>
              ) : (
                <div className="divide-y">
                  {companies.map((company) => (
                    <div 
                      key={company.id}
                      className={`p-4 hover:bg-gray-50 transition ${selected.has(company.id) ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={selected.has(company.id)}
                          onChange={() => toggleSelect(company.id)}
                          className="rounded mt-1"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">
                                {company.name}
                              </h3>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-600">{company.sector}</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-sm text-gray-600">{company.city}, {company.province}</span>
                                {company.employee_count && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-sm text-gray-600">{company.employee_count.toLocaleString()} employees</span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Score Badge */}
                            <div className="flex items-center gap-2">
                              <div className={`${getScoreColor(company.lead_score)} text-white px-3 py-1 rounded-full text-sm font-bold`}>
                                {company.lead_score}
                              </div>
                            </div>
                          </div>

                          {/* Tags */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              company.size === 'enterprise' ? 'bg-purple-100 text-purple-700' :
                              company.size === 'large' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {getSizeLabel(company.size)}
                            </span>
                            {company.is_government && (
                              <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                                🏛️ Government
                              </span>
                            )}
                            {company.is_enterprise && (
                              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                                🏢 Enterprise
                              </span>
                            )}
                            {company.is_tech && (
                              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                💻 Tech
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {company.description && (
                            <p className="text-sm text-gray-600 mt-2">{company.description}</p>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-4 mt-3">
                            {company.website && (
                              <a 
                                href={`https://${company.website}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-[#1d4ed8] hover:underline"
                              >
                                🌐 {company.website}
                              </a>
                            )}
                            
                            <select
                              value={company.status}
                              onChange={(e) => updateStatus(company.id, e.target.value)}
                              className={`text-sm border rounded px-2 py-1 ${
                                company.status === 'won' ? 'bg-green-100 border-green-300' :
                                company.status === 'lost' ? 'bg-red-100 border-red-300' :
                                company.status === 'qualified' ? 'bg-blue-100 border-blue-300' :
                                ''
                              }`}
                            >
                              <option value="new">📋 New</option>
                              <option value="contacted">📧 Contacted</option>
                              <option value="qualified">✅ Qualified</option>
                              <option value="proposal">📄 Proposal</option>
                              <option value="negotiation">🤝 Negotiation</option>
                              <option value="won">🎉 Won</option>
                              <option value="lost">❌ Lost</option>
                            </select>
                            
                            <Link 
                              href={`/admin?edit=${company.id}`}
                              className="text-sm text-gray-600 hover:text-[#1d4ed8]"
                            >
                              ✏️ Edit
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>Versis Lead Finder • Built for the Versis Sales Team</p>
        </div>
      </footer>
    </div>
  );
}
