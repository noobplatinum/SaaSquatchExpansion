import { NextRequest, NextResponse } from 'next/server';

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
    is_enriched?: boolean;
}

const generateEmailHTML = (leads: Lead[], topLeads: Lead[]) => {
    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SaaSquatch Lead Summary</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #16a34a, #059669); color: white; padding: 30px 40px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
            .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 16px; }
            .content { padding: 40px; }
            .summary-stats { display: flex; justify-content: space-around; margin: 30px 0; }
            .stat-box { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; flex: 1; margin: 0 10px; }
            .stat-number { font-size: 32px; font-weight: 700; color: #16a34a; display: block; }
            .stat-label { color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
            .section-title { font-size: 24px; font-weight: 600; color: #1f2937; margin: 40px 0 20px 0; border-bottom: 3px solid #16a34a; padding-bottom: 10px; }
            .top-leads { margin: 30px 0; }
            .top-lead-card { border: 2px solid #16a34a; border-radius: 12px; padding: 25px; margin: 20px 0; background: linear-gradient(45deg, #f0fdf4, #ecfdf5); }
            .top-lead-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
            .company-name { font-size: 20px; font-weight: 700; color: #1f2937; }
            .fit-score { background: #16a34a; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; }
            .lead-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 15px; }
            .detail-item { padding: 8px 0; }
            .detail-label { font-weight: 600; color: #6b7280; font-size: 13px; text-transform: uppercase; }
            .detail-value { color: #1f2937; font-size: 15px; }
            .leads-table { width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
            .leads-table th { background: #f8f9fa; padding: 15px 12px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
            .leads-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            .leads-table tr:nth-child(even) { background: #f9fafb; }
            .leads-table tr:hover { background: #f3f4f6; }
            .enriched-badge { background: #16a34a; color: white; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
            .tag { background: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 12px; font-size: 11px; margin-right: 5px; }
            .footer { background: #f8f9fa; padding: 30px 40px; text-align: center; color: #6b7280; border-top: 1px solid #e5e7eb; }
            .footer p { margin: 5px 0; }
            .cta-button { display: inline-block; background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
            .contact-info { background: #f0fdf4; padding: 8px 12px; border-radius: 6px; font-size: 13px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎯 Lead Discovery Summary</h1>
                <p>Generated on ${currentDate}</p>
            </div>
            
            <div class="content">
                <div class="summary-stats">
                    <div class="stat-box">
                        <span class="stat-number">${leads.length}</span>
                        <div class="stat-label">Total Leads</div>
                    </div>
                    <div class="stat-box">
                        <span class="stat-number">${leads.filter(l => l.is_enriched).length}</span>
                        <div class="stat-label">Enriched</div>
                    </div>
                    <div class="stat-box">
                        <span class="stat-number">${topLeads.length}</span>
                        <div class="stat-label">High-Quality</div>
                    </div>
                    <div class="stat-box">
                        <span class="stat-number">${leads.filter(l => l.owner_email).length}</span>
                        <div class="stat-label">With Contacts</div>
                    </div>
                </div>

                <h2 class="section-title">🔥 Top Opportunity Leads</h2>
                <div class="top-leads">
                    ${topLeads.map(lead => `
                        <div class="top-lead-card">
                            <div class="top-lead-header">
                                <div class="company-name">${lead.company}</div>
                                <div class="fit-score">${lead.fit_score?.toFixed(1)}/10</div>
                            </div>
                            <div style="color: #6b7280; margin-bottom: 10px;">${lead.industry}</div>
                            
                            <div class="lead-details">
                                <div class="detail-item">
                                    <div class="detail-label">Website</div>
                                    <div class="detail-value">${lead.website || 'Not available'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Company Size</div>
                                    <div class="detail-value">${lead.employees ? `${lead.employees} employees` : 'Not disclosed'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Revenue</div>
                                    <div class="detail-value">${lead.revenue || 'Not disclosed'}</div>
                                </div>
                                <div class="detail-item">
                                    <div class="detail-label">Contact</div>
                                    <div class="detail-value">
                                        ${lead.owner_email ? `
                                            <div class="contact-info">
                                                <strong>${lead.owner_name || 'Contact Available'}</strong><br>
                                                ${lead.owner_email}
                                            </div>
                                        ` : 'Contact info not enriched'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <h2 class="section-title">📊 Complete Leads Table</h2>
                <table class="leads-table">
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Industry</th>
                            <th>Size</th>
                            <th>Contact</th>
                            <th>Fit Score</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leads.map(lead => `
                            <tr>
                                <td>
                                    <strong>${lead.company}</strong><br>
                                    <small style="color: #6b7280;">${lead.website}</small>
                                </td>
                                <td>${lead.industry}</td>
                                <td>
                                    ${lead.employees ? `${lead.employees} employees` : '-'}<br>
                                    <small style="color: #6b7280;">${lead.revenue || ''}</small>
                                </td>
                                <td>
                                    ${lead.owner_email ? `
                                        <div style="color: #16a34a;">✓ Available</div>
                                        <small>${lead.owner_name}</small>
                                    ` : '<span style="color: #9ca3af;">Not enriched</span>'}
                                </td>
                                <td>
                                    <strong style="color: ${lead.fit_score && lead.fit_score >= 8 ? '#16a34a' : lead.fit_score && lead.fit_score >= 6 ? '#f59e0b' : '#6b7280'}">
                                        ${lead.fit_score?.toFixed(1) || '-'}/10
                                    </strong>
                                </td>
                                <td>
                                    ${lead.is_enriched ? '<span class="enriched-badge">ENRICHED</span>' : '<span class="tag">PROSPECT</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="text-align: center; margin: 40px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" class="cta-button">
                        🚀 Continue Lead Research
                    </a>
                </div>
            </div>
            
            <div class="footer">
                <p><strong>SaaSquatch Alerts</strong> - Intelligent Lead Discovery Platform</p>
                <p>This summary was generated automatically from your lead research session.</p>
                <p style="font-size: 12px; margin-top: 15px;">
                    Questions? Reply to this email or visit our dashboard for more insights.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
};

export async function POST(request: NextRequest) {
    try {
        const { email, leads } = await request.json();

        if (!email || !leads || leads.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Email and leads are required' },
                { status: 400 }
            );
        }

        const topLeads = leads
            .filter((lead: Lead) => lead.fit_score)
            .sort((a: Lead, b: Lead) => (b.fit_score || 0) - (a.fit_score || 0))
            .slice(0, 3);

        const htmlContent = generateEmailHTML(leads, topLeads);

        const mailgunDomain = process.env.MAILGUN_DOMAIN;
        const mailgunApiKey = process.env.MAILGUN_API_KEY;
        const fromEmail = process.env.FROM_EMAIL || `noreply@${mailgunDomain}`;

        if (!mailgunDomain || !mailgunApiKey) {
            console.error('Mailgun configuration missing');
            return NextResponse.json(
                { success: false, error: 'Email service not configured' },
                { status: 500 }
            );
        }

        const formData = new FormData();
        formData.append('from', `SaaSquatch Alerts <${fromEmail}>`);
        formData.append('to', email);
        formData.append('subject', `🎯 Lead Discovery Summary - ${leads.length} Prospects Found`);
        formData.append('html', htmlContent);

        const mailgunResponse = await fetch(
            `https://api.mailgun.net/v3/${mailgunDomain}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString('base64')}`,
                },
                body: formData,
            }
        );

        if (!mailgunResponse.ok) {
            const errorData = await mailgunResponse.text();
            console.error('Mailgun error:', errorData);
            throw new Error('Failed to send email');
        }

        const result = await mailgunResponse.json();
        console.log('Email sent successfully:', result);

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully',
            messageId: result.id
        });

    } catch (error) {
        console.error('Email sending failed:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send email' },
            { status: 500 }
        );
    }
}