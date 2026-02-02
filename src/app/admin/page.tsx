'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Company {
  id?: number;
  name: string;
  kvk_number: string;
  sector: string;
  subsector: string;
  size: string;
  employee_count: string;
  revenue_estimate: string;
  city: string;
  province: string;
  address: string;
  postal_code: string;
  website: string;
  email: string;
  phone: string;
  description: string;
  is_government: boolean;
  is_enterprise: boolean;
  is_tech: boolean;
  status: string;
  notes: string;
}

const emptyCompany: Company = {
  name: '',
  kvk_number: '',
  sector: '',
  subsector: '',
  size: 'medium',
  employee_count: '',
  revenue_estimate: '',
  city: '',
  province: '',
  address: '',
  postal_code: '',
  website: '',
  email: '',
  phone: '',
  description: '',
  is_government: false,
  is_enterprise: false,
  is_tech: false,
  status: 'new',
  notes: ''
};

const sectors = [
  'Overheid',
  'Financiële dienstverlening',
  'Gezondheidszorg',
  'ICT & Technologie',
  'Energie & Utilities',
  'Industrie & Productie',
  'Transport & Logistiek',
  'Zakelijke dienstverlening',
  'Bouw & Vastgoed',
  'Onderwijs',
  'Retail & E-commerce',
  'Horeca & Recreatie'
];

const provinces = [
  'Noord-Holland',
  'Zuid-Holland',
  'Utrecht',
  'Noord-Brabant',
  'Gelderland',
  'Overijssel',
  'Limburg',
  'Groningen',
  'Friesland',
  'Drenthe',
  'Flevoland',
  'Zeeland'
];

const sizes = [
  { value: 'micro', label: 'Micro (1-9 employees)' },
  { value: 'small', label: 'Small (10-49 employees)' },
  { value: 'medium', label: 'Medium (50-249 employees)' },
  { value: 'large', label: 'Large (250-999 employees)' },
  { value: 'enterprise', label: 'Enterprise (1000+ employees)' }
];

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  
  const [company, setCompany] = useState<Company>(emptyCompany);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (editId) {
      loadCompany(editId);
    }
  }, [editId]);

  const loadCompany = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCompany({
          ...data,
          employee_count: data.employee_count?.toString() || '',
          kvk_number: data.kvk_number || '',
          subsector: data.subsector || '',
          revenue_estimate: data.revenue_estimate || '',
          address: data.address || '',
          postal_code: data.postal_code || '',
          website: data.website || '',
          email: data.email || '',
          phone: data.phone || '',
          description: data.description || '',
          notes: data.notes || ''
        });
      } else {
        setMessage({ type: 'error', text: 'Company not found' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load company' });
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setCompany(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        ...company,
        employee_count: company.employee_count ? parseInt(company.employee_count) : null
      };

      const url = editId ? `/api/companies/${editId}` : '/api/companies';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMessage({ type: 'success', text: editId ? 'Company updated!' : 'Company created!' });
        if (!editId) {
          setCompany(emptyCompany);
        }
        setTimeout(() => router.push('/'), 1500);
      } else {
        setMessage({ type: 'error', text: 'Failed to save company' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }

    setSaving(false);
  };

  const handleDelete = async () => {
    if (!editId || !confirm('Are you sure you want to delete this company?')) return;

    try {
      const res = await fetch(`/api/companies/${editId}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/');
      } else {
        setMessage({ type: 'error', text: 'Failed to delete company' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1d4ed8] text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                {editId ? 'Edit Company' : 'Add New Company'}
              </h1>
              <p className="text-blue-200">Versis Lead Finder</p>
            </div>
            <Link 
              href="/" 
              className="bg-white text-[#1d4ed8] px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition"
            >
              ← Back to Leads
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Basic Info */}
            <div className="col-span-2">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Basic Information</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={company.name}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                KVK Number
              </label>
              <input
                type="text"
                name="kvk_number"
                value={company.kvk_number}
                onChange={handleChange}
                placeholder="e.g., 12345678"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sector <span className="text-red-500">*</span>
              </label>
              <select
                name="sector"
                value={company.sector}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select sector...</option>
                {sectors.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subsector
              </label>
              <input
                type="text"
                name="subsector"
                value={company.subsector}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Size <span className="text-red-500">*</span>
              </label>
              <select
                name="size"
                value={company.size}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                {sizes.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee Count
              </label>
              <input
                type="number"
                name="employee_count"
                value={company.employee_count}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* Location */}
            <div className="col-span-2">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b mt-4">Location</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={company.city}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Province <span className="text-red-500">*</span>
              </label>
              <select
                name="province"
                value={company.province}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Select province...</option>
                {provinces.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={company.address}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                name="postal_code"
                value={company.postal_code}
                onChange={handleChange}
                placeholder="e.g., 1234 AB"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* Contact */}
            <div className="col-span-2">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b mt-4">Contact Information</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="text"
                name="website"
                value={company.website}
                onChange={handleChange}
                placeholder="e.g., example.nl"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={company.email}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={company.phone}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            {/* Classification */}
            <div className="col-span-2">
              <h2 className="text-lg font-semibold mb-4 pb-2 border-b mt-4">Classification</h2>
            </div>

            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_government"
                  checked={company.is_government}
                  onChange={handleChange}
                  className="rounded"
                />
                <span>🏛️ Government</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_enterprise"
                  checked={company.is_enterprise}
                  onChange={handleChange}
                  className="rounded"
                />
                <span>🏢 Enterprise</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_tech"
                  checked={company.is_tech}
                  onChange={handleChange}
                  className="rounded"
                />
                <span>💻 Tech Company</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={company.status}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={company.description}
                onChange={handleChange}
                rows={3}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                value={company.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Internal notes..."
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {editId ? (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-600 transition"
              >
                🗑️ Delete
              </button>
            ) : (
              <div></div>
            )}
            
            <div className="flex gap-4">
              <Link 
                href="/"
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#1d4ed8] text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : (editId ? 'Update Company' : 'Add Company')}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500">Loading...</div>
    </div>}>
      <AdminContent />
    </Suspense>
  );
}
