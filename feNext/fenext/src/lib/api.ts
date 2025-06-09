const API_BASE_URL = 'http://localhost:5000/api';

export interface SearchFilters {
  query: string;
  limit?: number;
  location?: string;
  industry?: string;
  business_type?: string;
  min_employees?: number;
  max_employees?: number;
  min_fit_score?: number;
  contact_info_required?: boolean;
  use_mock?: boolean;
}

export interface BaseLead {
  company: string;
  industry?: string;
  address?: string;
  bbb_rating?: string;
  phone?: string;
  website?: string;
  source: string;
  created_at: string;
}

export interface OwnerInfo {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
}

export interface EnrichedLead extends BaseLead {
  revenue?: string;
  employees?: number;
  founded_year?: number;
  owner_info?: OwnerInfo;
  company_linkedin?: string;
  activity_score: number;
  fit_score: number;
  tags: string[];
  enriched_at: string;
}

export interface SearchResponse {
  success: boolean;
  leads: BaseLead[];
  count: number;
  query: string;
  mode: string;
}

export interface EnrichResponse {
  success: boolean;
  enriched_leads: EnrichedLead[];
  count: number;
}

export async function searchLeads(filters: SearchFilters): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE_URL}/leads/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: filters.query,
      limit: filters.limit || 20,
      location: filters.location || '',
      use_mock: filters.use_mock !== false, 
    }),
  });

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  return response.json();
}

export async function enrichLeads(leads: BaseLead[], filters?: Partial<SearchFilters>): Promise<EnrichResponse> {
  const response = await fetch(`${API_BASE_URL}/leads/enrich`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      leads,
      use_mock: true, 
      user_preferences: {
        target_industries: filters?.industry ? [filters.industry] : undefined,
        min_employees: filters?.min_employees,
        max_employees: filters?.max_employees,
        business_type_preference: filters?.business_type,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Enrichment failed: ${response.statusText}`);
  }

  return response.json();
}

export async function healthCheck() {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}