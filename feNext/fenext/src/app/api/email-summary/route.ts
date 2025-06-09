import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

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
        <title>SaaSquatch Lead Summary</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; margin: 0; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: linear-gradient(135deg, #16a34a, #059669); color: white; padding: 30px; text-align: center; }
            .header h1 { color: #bbf7d0; margin: 0; }
            .header p { color: #bbf7d0; margin: 10px 0 0 0; }
            .content { padding: 40px; color: #333; }
            .stat-box { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; margin: 10px; }
            .stat-number { font-size: 32px; font-weight: 700; color: #16a34a; }
            .top-lead { border: 2px solid #16a34a; border-radius: 12px; padding: 20px; margin: 20px 0; background: #f0fdf4; }
            .top-lead h3 { color: #333; }
            .top-lead p { color: #333; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th { background: #f8f9fa; padding: 12px; text-align: left; color: #333; }
            .table td { padding: 12px; border-bottom: 1px solid #e5e7eb; color: #333; }
            h2 { color: #333; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Lead Discovery Summary</h1>
                <p>Generated on ${currentDate}</p>
            </div>
            
            <div class="content">
                <div style="display: flex; justify-content: space-around;">
                    <div class="stat-box">
                        <div class="stat-number">${leads.length}</div>
                        <div style="color: #666;">Total Leads</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${leads.filter(l => l.is_enriched).length}</div>
                        <div style="color: #666;">Enriched</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-number">${leads.filter(l => l.owner_email).length}</div>
                        <div style="color: #666;">With Contacts</div>
                    </div>
                </div>

                <h2>Top Leads</h2>
                ${topLeads.map(lead => `
                    <div class="top-lead">
                        <h3>${lead.company} - ${lead.fit_score?.toFixed(1)}/10</h3>
                        <p><strong>Industry:</strong> ${lead.industry}</p>
                        <p><strong>Website:</strong> ${lead.website}</p>
                        ${lead.employees ? `<p><strong>Size:</strong> ${lead.employees} employees</p>` : ''}
                        ${lead.owner_email ? `<p><strong>Contact:</strong> ${lead.owner_name} (${lead.owner_email})</p>` : ''}
                    </div>
                `).join('')}

                <h2>All Leads</h2>
                <table class="table">
                    <thead>
                        <tr>
                            <th>Company</th>
                            <th>Industry</th>
                            <th>Fit Score</th>
                            <th>Contact</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leads.map(lead => `
                            <tr>
                                <td><strong>${lead.company}</strong></td>
                                <td>${lead.industry}</td>
                                <td>${lead.fit_score?.toFixed(1) || '-'}/10</td>
                                <td>${lead.owner_email ? '✓ Available' : 'Not enriched'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </body>
    </html>
    `;
};

const resend = new Resend(process.env.RESEND_API_KEY);

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

        const { data, error } = await resend.emails.send({
            from: 'SaaSquatch Alerts <onboarding@resend.dev>',
            to: [email],
            subject: `Lead Discovery Summary - ${leads.length} Prospects Found`,
            html: htmlContent,
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully',
            messageId: data?.id
        });

    } catch (error) {
        console.error('Email sending failed:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to send email' },
            { status: 500 }
        );
    }
}