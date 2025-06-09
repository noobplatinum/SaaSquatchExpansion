'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Auth() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'login');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        name: '',
        company: '',
        linkedin_url: '',
        target_industries: '',
        min_employees: '',
        max_employees: '',
        min_revenue: '',
        max_revenue: '',
        business_type_preference: '',
        require_contact_info: true
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
            let payload;

            if (activeTab === 'login') {
                payload = { email: formData.email, password: formData.password };
            } else {
                const targetIndustries = formData.target_industries
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);

                const parseRevenue = (value: string): number | null => {
                    console.log('Parsing revenue value:', value);

                    if (!value || !value.trim()) {
                        console.log('Revenue value is empty');
                        return null;
                    }

                    const cleanValue = value.replace(',', '.').trim();
                    console.log('Cleaned revenue value:', cleanValue);

                    const parsed = parseFloat(cleanValue);
                    console.log('Parsed float:', parsed);

                    if (isNaN(parsed)) {
                        console.log('Revenue parsing failed - NaN');
                        return null;
                    }

                    const result = Math.round(parsed * 1000000);
                    console.log('Final revenue value (in dollars):', result);
                    return result;
                };

                const minRevenue = parseRevenue(formData.min_revenue);
                const maxRevenue = parseRevenue(formData.max_revenue);

                payload = {
                    email: formData.email,
                    username: formData.username,
                    password: formData.password,
                    linkedin_url: formData.linkedin_url || null,
                    target_industries: targetIndustries.length > 0 ? targetIndustries : null,
                    min_employees: formData.min_employees ? parseInt(formData.min_employees) : null,
                    max_employees: formData.max_employees ? parseInt(formData.max_employees) : null,
                    min_revenue: minRevenue,
                    max_revenue: maxRevenue,
                    business_type_preference: formData.business_type_preference || null,
                    require_contact_info: formData.require_contact_info,
                };

                console.log('Final payload being sent:', payload);
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Authentication failed');
            }

            localStorage.setItem('user', JSON.stringify(data.user));
            router.push('/dashboard');

        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
            <div className="w-full max-w-lg">
                {/* Back to Home */}
                <Link href="/" className="flex items-center text-green-400 hover:text-green-300 mb-8 transition-colors">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Home
                </Link>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white">SaaSquatch Alerts</h1>
                    <p className="text-slate-300 mt-2">AI-Powered Lead Intelligence</p>
                </div>

                <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-6">
                    <div className="flex mb-6">
                        <button
                            onClick={() => setActiveTab('login')}
                            className={`flex-1 py-2 text-center rounded-lg transition-colors ${activeTab === 'login'
                                    ? 'bg-green-600 text-white'
                                    : 'text-slate-300 hover:text-white'
                                }`}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => setActiveTab('register')}
                            className={`flex-1 py-2 text-center rounded-lg transition-colors ${activeTab === 'register'
                                    ? 'bg-green-600 text-white'
                                    : 'text-slate-300 hover:text-white'
                                }`}
                        >
                            Register
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {activeTab === 'register' && (
                            <>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Username *
                                        </label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                                            placeholder="Choose a username"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                                            placeholder="Your full name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Company
                                    </label>
                                    <input
                                        type="text"
                                        name="company"
                                        value={formData.company}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                                        placeholder="Your company name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        LinkedIn URL (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        name="linkedin_url"
                                        value={formData.linkedin_url}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                                        placeholder="https://linkedin.com/in/your-profile"
                                    />
                                </div>

                                <div className="pt-4 border-t border-slate-600">
                                    <h4 className="text-lg font-semibold text-white mb-4">🎯 Ideal Customer Profile</h4>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Target Industries (comma-separated)
                                        </label>
                                        <input
                                            type="text"
                                            name="target_industries"
                                            value={formData.target_industries}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                                            placeholder="e.g., SaaS, Fintech, E-commerce"
                                        />
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Employee Range
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    name="min_employees"
                                                    value={formData.min_employees}
                                                    onChange={handleInputChange}
                                                    placeholder="Min"
                                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                                                />
                                                <input
                                                    type="number"
                                                    name="max_employees"
                                                    value={formData.max_employees}
                                                    onChange={handleInputChange}
                                                    placeholder="Max"
                                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                                Revenue Range (Millions USD)
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    name="min_revenue"
                                                    value={formData.min_revenue}
                                                    onChange={handleInputChange}
                                                    placeholder="1.5 or 1,5"
                                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    name="max_revenue"
                                                    value={formData.max_revenue}
                                                    onChange={handleInputChange}
                                                    placeholder="10.0 or 10,0"
                                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Use . or , for decimals (e.g., "2.5" for $2.5M)
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Business Type Preference
                                        </label>
                                        <select
                                            name="business_type_preference"
                                            value={formData.business_type_preference}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
                                        >
                                            <option value="">No preference</option>
                                            <option value="B2B">B2B</option>
                                            <option value="B2C">B2C</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="require_contact_info"
                                            checked={formData.require_contact_info}
                                            onChange={handleInputChange}
                                            className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                                        />
                                        <label className="ml-2 text-sm text-slate-300">
                                            Prioritize leads with contact information
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Password *
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-green-500 focus:outline-none"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white py-3 rounded-lg font-semibold transition-colors"
                        >
                            {isLoading
                                ? 'Please wait...'
                                : activeTab === 'login' ? 'Sign In' : 'Create Account'
                            }
                        </button>
                    </form>

                    {activeTab === 'login' && (
                        <div className="text-center mt-4">
                            <a href="#" className="text-green-400 hover:text-green-300 text-sm transition-colors">
                                Forgot your password?
                            </a>
                        </div>
                    )}
                </div>

                <div className="text-center mt-6">
                    <p className="text-slate-400 text-sm">
                        This is a demo for the Caprae Capital AI Challenge
                    </p>
                </div>
            </div>
        </div>
    );
}