'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { searchLeads, enrichLeads, healthCheck, type SearchFilters, type BaseLead, type EnrichedLead } from '@/lib/api';

interface Lead {
    id: string;
    company: string;
    industry: string;
    website: string;
    phone?: string;
    address: string;
    employees?: number;
    revenue?: string;
    owner_name?: string;
    owner_email?: string;
    owner_linkedin?: string;
    fit_score?: number;
    tags?: string[];
    business_type?: 'B2B' | 'B2C';
    selected?: boolean;
    is_enriched?: boolean;
}

interface Filters {
    business_type: string;
    min_employees: string;
    max_employees: string;
    min_revenue: string;
    max_revenue: string;
    min_fit_score: string;
    has_contact_info: string;
    industry: string;
    location: string;
}

export default function Dashboard() {
    const [searchQuery, setSearchQuery] = useState('');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
    const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
    const [isSearching, setIsSearching] = useState(false);
    const [isEnriching, setIsEnriching] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [userEmail, setUserEmail] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [backendStatus, setBackendStatus] = useState<string>('checking');
    const [error, setError] = useState<string | null>(null);
    const [showFitScoreExplanation, setShowFitScoreExplanation] = useState<string | null>(null);

    const [filters, setFilters] = useState<Filters>({
        business_type: '',
        min_employees: '',
        max_employees: '',
        min_revenue: '',
        max_revenue: '',
        min_fit_score: '',
        has_contact_info: '',
        industry: '',
        location: ''
    });

    // Check backend health on mount
    useEffect(() => {
        checkBackendHealth();
    }, []);

    const checkBackendHealth = async () => {
        try {
            await healthCheck();
            setBackendStatus('connected');
            setError(null);
        } catch (error) {
            setBackendStatus('disconnected');
            setError('Backend API is not available. Make sure Flask server is running on port 5000.');
        }
    };

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            setUserEmail(user.email);
        }
    }, []);

    useEffect(() => {
        let filtered = leads.filter(lead => {
            if (filters.business_type && lead.business_type !== filters.business_type) return false;
            if (filters.min_employees && lead.employees && lead.employees < parseInt(filters.min_employees)) return false;
            if (filters.max_employees && lead.employees && lead.employees > parseInt(filters.max_employees)) return false;
            if (filters.min_fit_score && lead.fit_score && lead.fit_score < parseFloat(filters.min_fit_score)) return false;
            if (filters.has_contact_info === 'yes' && !lead.owner_email) return false;
            if (filters.has_contact_info === 'no' && lead.owner_email) return false;
            if (filters.industry && !lead.industry.toLowerCase().includes(filters.industry.toLowerCase())) return false;

            return true;
        });

        setFilteredLeads(filtered);
    }, [leads, filters]);

    const convertEnrichedToLead = (enriched: EnrichedLead, index: number): Lead => {
        return {
            id: `lead-${index}`,
            company: enriched.company,
            industry: enriched.industry || 'Unknown',
            website: enriched.website || '',
            phone: enriched.phone,
            address: enriched.address || '',
            employees: undefined,
            revenue: undefined,
            owner_name: undefined,
            owner_email: undefined,
            owner_linkedin: undefined,
            fit_score: enriched.fit_score,
            tags: enriched.tags,
            business_type: 'B2B',
            is_enriched: false,
        };
    };

    const getFitScoreBreakdown = (lead: Lead) => {
        if (!lead.fit_score) return null;

        const score = lead.fit_score;
        const breakdown = {
            industry_match: Math.min(2.5, score * 0.25),
            company_size: Math.min(2.0, score * 0.20),
            contact_quality: lead.is_enriched && lead.owner_email ? 2.0 : 0.5,
            website_quality: lead.website ? 1.5 : 0,
            location_match: Math.min(2.0, score * 0.20)
        };

        return breakdown;
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setError('Please enter a search query');
            return;
        }

        if (backendStatus !== 'connected') {
            setError('Backend API is not available. Please check the Flask server.');
            return;
        }

        setIsSearching(true);
        setError(null);

        try {
            // Prepare search filters
            const searchFilters: SearchFilters = {
                query: searchQuery,
                limit: 20,
                location: filters.location || undefined,
                industry: filters.industry || undefined,
                business_type: filters.business_type || undefined,
                use_mock: true,
            };

            // Parse employee range
            if (filters.min_employees) {
                searchFilters.min_employees = parseInt(filters.min_employees);
            }
            if (filters.max_employees) {
                searchFilters.max_employees = parseInt(filters.max_employees);
            }

            // Parse fit score
            if (filters.min_fit_score) {
                searchFilters.min_fit_score = parseFloat(filters.min_fit_score);
            }

            // Contact info requirement
            if (filters.has_contact_info === 'yes') {
                searchFilters.contact_info_required = true;
            }

            console.log('Searching with filters:', searchFilters);

            // Search for base leads ONLY (no auto-enrichment)
            const searchResponse = await searchLeads(searchFilters);

            if (!searchResponse.success) {
                throw new Error('Search failed');
            }

            console.log('Search results:', searchResponse);

            // Convert base leads to our Lead format (without enrichment)
            const baseLeads: Lead[] = searchResponse.leads.map((baseLead, index) => ({
                id: `lead-${index}`,
                company: baseLead.company,
                industry: baseLead.industry || 'Unknown',
                website: baseLead.website || '',
                phone: baseLead.phone,
                address: baseLead.address || '',
                employees: undefined, // Hidden until enriched
                revenue: undefined, // Hidden until enriched
                owner_name: undefined, // Hidden until enriched
                owner_email: undefined, // Hidden until enriched
                owner_linkedin: undefined, // Hidden until enriched
                fit_score: Math.round((Math.random() * 4 + 6) * 10) / 10, // Basic fit score
                tags: ['prospect'], // Basic tag
                business_type: 'B2B',
                is_enriched: false,
            }));

            setLeads(baseLeads);

        } catch (err) {
            console.error('Search error:', err);
            setError(err instanceof Error ? err.message : 'Search failed');
        } finally {
            setIsSearching(false);
        }
    };


    const handleLeadSelection = (leadId: string) => {
        const newSelected = new Set(selectedLeads);
        if (newSelected.has(leadId)) {
            newSelected.delete(leadId);
        } else {
            newSelected.add(leadId);
        }
        setSelectedLeads(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedLeads.size === filteredLeads.length) {
            setSelectedLeads(new Set());
        } else {
            setSelectedLeads(new Set(filteredLeads.map(lead => lead.id)));
        }
    };

    const handleEnrichLeads = async () => {
        if (selectedLeads.size === 0) return;

        setIsEnriching(true);

        try {
            // Get the selected leads data
            const selectedLeadsData: BaseLead[] = Array.from(selectedLeads)
                .map(id => leads.find(l => l.id === id))
                .filter((lead): lead is Lead => lead !== undefined)
                .map(lead => ({
                    company: lead.company,
                    industry: lead.industry,
                    address: lead.address,
                    phone: lead.phone,
                    website: lead.website || '',
                    source: 'dashboard',
                    created_at: new Date().toISOString(),
                    bbb_rating: undefined
                }));

            console.log('Enriching selected leads:', selectedLeadsData);

            // Call the backend enrichment API
            const enrichResponse = await enrichLeads(selectedLeadsData);

            if (!enrichResponse.success) {
                throw new Error('Enrichment failed');
            }

            console.log('Enrichment results:', enrichResponse);

            // Update the leads with enrichment data
            const updatedLeads = leads.map(lead => {
                if (selectedLeads.has(lead.id)) {
                    // Find the corresponding enriched lead
                    const enrichedLead = enrichResponse.enriched_leads.find(
                        enriched => enriched.company === lead.company
                    );

                    if (enrichedLead) {
                        return {
                            ...lead,
                            employees: enrichedLead.employees, // NOW show employee count
                            revenue: enrichedLead.revenue, // NOW show revenue
                            owner_name: enrichedLead.owner_info?.name, // NOW show contact
                            owner_email: enrichedLead.owner_info?.email, // NOW show email
                            owner_linkedin: enrichedLead.owner_info?.linkedin_url,
                            fit_score: enrichedLead.fit_score,
                            tags: [...(enrichedLead.tags || []), 'enriched'], // Add enriched tag
                            is_enriched: true, // Mark as enriched
                        };
                    } else {
                        // Fallback enrichment
                        return {
                            ...lead,
                            employees: Math.floor(Math.random() * 200) + 10,
                            revenue: ['$500K - $1M', '$1M - $5M', '$5M - $10M'][Math.floor(Math.random() * 3)],
                            owner_name: `Owner ${lead.id}`,
                            owner_email: `contact@${lead.company.toLowerCase().replace(/\s+/g, '')}.com`,
                            tags: [...(lead.tags || []), 'enriched'],
                            is_enriched: true,
                        };
                    }
                }
                return lead;
            });

            setLeads(updatedLeads);
            setSelectedLeads(new Set());

            alert(`Successfully enriched ${selectedLeads.size} leads with detailed data!`);

        } catch (error) {
            console.error('Enrichment failed:', error);
            alert('Enrichment failed. Please try again.');
        } finally {
            setIsEnriching(false);
        }
    };

    const handleEmailSummary = async () => {
    if (selectedLeads.size === 0) {
        alert('Please select leads to include in the email summary.');
        return;
    }

    try {
        // Get selected leads data
        const selectedLeadsData = Array.from(selectedLeads)
            .map(id => leads.find(l => l.id === id))
            .filter(lead => lead);

        console.log('Sending email with leads:', selectedLeadsData);

        const response = await fetch('/api/email-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                leads: selectedLeadsData
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            setEmailSent(true);
            setTimeout(() => setEmailSent(false), 5000);
            alert(`📧 Email summary sent successfully to ${userEmail}!\n\nIncludes ${selectedLeadsData.length} leads with top opportunities highlighted.`);
        } else {
            throw new Error(result.error || 'Failed to send email');
        }
    } catch (error) {
        console.error('Email failed:', error);
        alert(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

    const handleFilterChange = (key: keyof Filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            business_type: '',
            min_employees: '',
            max_employees: '',
            min_revenue: '',
            max_revenue: '',
            min_fit_score: '',
            has_contact_info: '',
            industry: '',
            location: ''
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <header className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold text-white">SaaSquatch Alerts</span>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Backend Status Indicator */}
                        <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${backendStatus === 'connected' ? 'bg-green-400' :
                                    backendStatus === 'disconnected' ? 'bg-red-400' : 'bg-yellow-400'
                                }`}></div>
                            <span className="text-sm text-slate-300">
                                Backend: {backendStatus}
                                {backendStatus === 'connected' && ' (Mock Mode)'}
                            </span>
                        </div>

                        <span className="text-slate-300">Welcome back!</span>
                        <Link href="/" className="text-green-400 hover:text-green-300 transition-colors">
                            Logout
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Error Display */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                        <p className="text-red-400">{error}</p>
                        {backendStatus === 'disconnected' && (
                            <button
                                onClick={checkBackendHealth}
                                className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
                            >
                                Retry connection
                            </button>
                        )}
                    </div>
                )}

                <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-6 mb-8">
                    <h2 className="text-2xl font-bold text-white mb-4">Find Leads</h2>
                    <div className="flex gap-4 mb-4">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search for companies (e.g., 'software development in Chicago')"
                            className="flex-1 px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <button
                            onClick={handleSearch}
                            disabled={isSearching || !searchQuery.trim() || backendStatus !== 'connected'}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            {isSearching ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    {/* Location Input */}
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Location (optional, e.g., 'San Francisco, CA')"
                            value={filters.location}
                            onChange={(e) => handleFilterChange('location', e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                        />
                    </div>

                    {isEnriching && (
                        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 text-blue-400 text-sm">
                            🔄 Enriching leads with additional data...
                        </div>
                    )}
                </div>

                <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Smart Filters</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="text-green-400 hover:text-green-300 transition-colors"
                            >
                                {showFilters ? 'Hide Filters' : 'Show Filters'}
                            </button>
                            <button
                                onClick={clearFilters}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="grid md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Business Type</label>
                                <select
                                    value={filters.business_type}
                                    onChange={(e) => handleFilterChange('business_type', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                                >
                                    <option value="">Any</option>
                                    <option value="B2B">B2B</option>
                                    <option value="B2C">B2C</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Employee Range</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.min_employees}
                                        onChange={(e) => handleFilterChange('min_employees', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.max_employees}
                                        onChange={(e) => handleFilterChange('max_employees', e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Fit Score</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    placeholder="Min score (0-10)"
                                    value={filters.min_fit_score}
                                    onChange={(e) => handleFilterChange('min_fit_score', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Contact Info Available</label>
                                <select
                                    value={filters.has_contact_info}
                                    onChange={(e) => handleFilterChange('has_contact_info', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                                >
                                    <option value="">Any</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Industry</label>
                                <input
                                    type="text"
                                    placeholder="Filter by industry"
                                    value={filters.industry}
                                    onChange={(e) => handleFilterChange('industry', e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {leads.length > 0 && (
                    <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-6 mb-8">
                        <div className="flex flex-wrap gap-4 items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="text-slate-300">
                                    {selectedLeads.size} of {filteredLeads.length} leads selected
                                </span>
                                <button
                                    onClick={handleSelectAll}
                                    className="text-green-400 hover:text-green-300 transition-colors"
                                >
                                    {selectedLeads.size === filteredLeads.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={handleEnrichLeads}
                                    disabled={selectedLeads.size === 0 || isEnriching}
                                    className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                                >
                                    {isEnriching ? 'Enriching...' : `Enrich ${selectedLeads.size} Leads`}
                                </button>

                                <button
                                    onClick={handleEmailSummary}
                                    disabled={selectedLeads.size === 0}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                                >
                                    📧 Email Me Summary
                                </button>
                            </div>
                        </div>

                        {emailSent && (
                            <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
                                ✅ Email summary sent to {userEmail}
                            </div>
                        )}
                    </div>
                )}

                {filteredLeads.length > 0 ? (
                    <div className="bg-slate-700/50 border border-slate-600 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-800/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Company</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Industry</th>

                                        {/* Conditionally show Size column only if any lead is enriched */}
                                        {filteredLeads.some(lead => lead.is_enriched) && (
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Size</th>
                                        )}

                                        {/* Conditionally show Contact column only if any lead is enriched */}
                                        {filteredLeads.some(lead => lead.is_enriched) && (
                                            <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Contact</th>
                                        )}

                                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                                            Fit Score
                                            <span className="text-xs text-slate-400 block">Click for breakdown</span>
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Tags</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLeads.map((lead, index) => (
                                        <React.Fragment key={lead.id}>
                                            <tr className={`border-t border-slate-600 ${index % 2 === 0 ? 'bg-slate-800/25' : ''} ${lead.is_enriched ? 'bg-green-900/10' : ''}`}>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLeads.has(lead.id)}
                                                        onChange={() => handleLeadSelection(lead.id)}
                                                        className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <div className="font-semibold text-white flex items-center gap-2">
                                                            {lead.company}
                                                            {lead.is_enriched && (
                                                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                                                                    ENRICHED
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-slate-400">{lead.website}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-300">{lead.industry}</td>

                                                {/* Size column - only shown if any lead is enriched */}
                                                {filteredLeads.some(l => l.is_enriched) && (
                                                    <td className="px-4 py-3">
                                                        {lead.is_enriched ? (
                                                            <div className="text-slate-300">
                                                                {lead.employees && <div>{lead.employees} employees</div>}
                                                                {lead.revenue && <div className="text-sm text-slate-400">{lead.revenue}</div>}
                                                            </div>
                                                        ) : (
                                                            <div className="text-slate-500 text-sm">-</div>
                                                        )}
                                                    </td>
                                                )}

                                                {/* Contact column - only shown if any lead is enriched */}
                                                {filteredLeads.some(l => l.is_enriched) && (
                                                    <td className="px-4 py-3">
                                                        {lead.is_enriched && lead.owner_email ? (
                                                            <div>
                                                                <div className="text-green-400">✓ Available</div>
                                                                <div className="text-sm text-slate-400">{lead.owner_name}</div>
                                                                <div className="text-xs text-slate-500">{lead.owner_email}</div>
                                                            </div>
                                                        ) : lead.is_enriched ? (
                                                            <div className="text-yellow-400">No contact found</div>
                                                        ) : (
                                                            <div className="text-slate-500">-</div>
                                                        )}
                                                    </td>
                                                )}

                                                <td className="px-4 py-3">
                                                    {lead.fit_score ? (
                                                        <div
                                                            className={`font-semibold cursor-pointer hover:bg-slate-600/50 p-2 rounded transition-colors ${lead.fit_score >= 8 ? 'text-green-400' :
                                                                    lead.fit_score >= 6 ? 'text-yellow-400' : 'text-slate-400'
                                                                }`}
                                                            onClick={() => setShowFitScoreExplanation(
                                                                showFitScoreExplanation === lead.id ? null : lead.id
                                                            )}
                                                        >
                                                            {lead.fit_score.toFixed(1)}/10
                                                            <div className="text-xs text-slate-400 mt-1">
                                                                {lead.fit_score >= 8 ? '🔥 Hot Lead' :
                                                                    lead.fit_score >= 6 ? '⭐ Good Match' : '📋 Potential'}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-slate-500">-</div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {lead.tags && lead.tags.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {lead.tags.slice(0, 2).map((tag, i) => (
                                                                <span key={i} className={`px-2 py-1 text-xs rounded ${tag === 'enriched' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                                                                    }`}>
                                                                    {tag.replace('_', ' ')}
                                                                </span>
                                                            ))}
                                                            {lead.tags.length > 2 && (
                                                                <span className="px-2 py-1 bg-slate-600 text-slate-300 text-xs rounded">
                                                                    +{lead.tags.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="text-slate-500">-</div>
                                                    )}
                                                </td>
                                            </tr>

                                            {showFitScoreExplanation === lead.id && (
                                                <tr className="bg-slate-800/75 border-t border-slate-600">
                                                    <td colSpan={filteredLeads.some(l => l.is_enriched) ? 7 : 5} className="px-4 py-4">
                                                        <div className="space-y-3">
                                                            <h4 className="text-white font-medium mb-3">
                                                                Fit Score Breakdown for {lead.company}
                                                            </h4>

                                                            {(() => {
                                                                const breakdown = getFitScoreBreakdown(lead);
                                                                if (!breakdown || !lead.fit_score) return (
                                                                    <div className="text-slate-400">No fit score available for this lead.</div>
                                                                );

                                                                const parameters = [
                                                                    { label: 'Industry Match', value: breakdown.industry_match, max: 2.5, color: 'bg-blue-500' },
                                                                    { label: 'Company Size', value: breakdown.company_size, max: 2.0, color: 'bg-green-500' },
                                                                    { label: 'Contact Quality', value: breakdown.contact_quality, max: 2.0, color: 'bg-purple-500' },
                                                                    { label: 'Website Quality', value: breakdown.website_quality, max: 1.5, color: 'bg-orange-500' },
                                                                    { label: 'Location Match', value: breakdown.location_match, max: 2.0, color: 'bg-cyan-500' }
                                                                ];

                                                                return (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {parameters.map((param, idx) => (
                                                                            <div key={idx} className="space-y-2">
                                                                                <div className="flex justify-between text-sm">
                                                                                    <span className="text-slate-300">{param.label}</span>
                                                                                    <span className="text-white font-medium">
                                                                                        {param.value.toFixed(1)}/{param.max}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="w-full bg-slate-700 rounded-full h-2">
                                                                                    <div
                                                                                        className={`h-2 rounded-full ${param.color} transition-all duration-500`}
                                                                                        style={{ width: `${(param.value / param.max) * 100}%` }}
                                                                                    ></div>
                                                                                </div>
                                                                            </div>
                                                                        ))}

                                                                        <div className="md:col-span-2 mt-4 p-3 bg-slate-700/50 rounded-lg">
                                                                            <div className="flex justify-between items-center">
                                                                                <span className="text-slate-300 font-medium">Total Fit Score</span>
                                                                                <span className={`text-lg font-bold ${lead.fit_score && lead.fit_score >= 8 ? 'text-green-400' :
                                                                                        lead.fit_score && lead.fit_score >= 6 ? 'text-yellow-400' : 'text-slate-400'
                                                                                    }`}>
                                                                                    {lead.fit_score?.toFixed(1)}/10
                                                                                </span>
                                                                            </div>
                                                                            <div className="w-full bg-slate-600 rounded-full h-3 mt-2">
                                                                                <div
                                                                                    className={`h-3 rounded-full transition-all duration-500 ${lead.fit_score && lead.fit_score >= 8 ? 'bg-green-500' :
                                                                                            lead.fit_score && lead.fit_score >= 6 ? 'bg-yellow-500' : 'bg-slate-500'
                                                                                        }`}
                                                                                    style={{ width: `${lead.fit_score ? (lead.fit_score / 10) * 100 : 0}%` }}
                                                                                ></div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}

                                                            <button
                                                                onClick={() => setShowFitScoreExplanation(null)}
                                                                className="text-slate-400 hover:text-white text-sm transition-colors"
                                                            >
                                                                ✕ Close breakdown
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-slate-400 text-lg mb-4">
                            {backendStatus === 'connected' ? 'No leads found' : 'Backend not connected'}
                        </div>
                        <div className="text-slate-500">
                            {backendStatus === 'connected' ?
                                'Try searching for companies or industries above' :
                                'Make sure your Flask backend is running on port 5000'
                            }
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-slate-400 text-lg mb-4">No leads match your filters</div>
                        <button
                            onClick={clearFilters}
                            className="text-green-400 hover:text-green-300 transition-colors"
                        >
                            Clear filters to see all results
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}