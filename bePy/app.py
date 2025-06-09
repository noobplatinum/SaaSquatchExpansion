from flask import Flask, request, jsonify
from flask_cors import CORS
from services.enhanced_mock_service import EnhancedMockService
from services.enrichment_service import EnrichmentService
import traceback
import random
from datetime import datetime

app = Flask(__name__)
CORS(app)

try:
    mock_service = EnhancedMockService()
    enrichment_service = EnrichmentService()
    print("✅ Services initialized successfully")
except Exception as e:
    print(f"❌ Service initialization failed: {e}")
    traceback.print_exc()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'services': {
            'mock_service': 'available',
            'enrichment_service': 'available'
        }
    })

@app.route('/api/leads/search', methods=['POST'])
def search_leads():
    try:
        data = request.get_json() or {}
        query = data.get('query', '')
        limit = data.get('limit', 20)
        location = data.get('location', '')
        
        print(f"🔍 Searching for: {query} (limit: {limit})")
        
        # Generate leads using enhanced mock service
        leads = mock_service.generate_leads(limit)
        
        # Convert to response format
        leads_data = []
        for lead in leads:
            lead_dict = {
                'company': lead.company,
                'industry': lead.industry,
                'address': lead.address,
                'phone': lead.phone,
                'website': lead.website,
                'source': 'mock',
                'created_at': lead.created_at
            }
            leads_data.append(lead_dict)
        
        response = {
            'success': True,
            'leads': leads_data,
            'count': len(leads_data),
            'query': query,
            'mode': 'mock'
        }
        
        print(f"✅ Returned {len(leads_data)} leads")
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Search error: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'leads': [],
            'count': 0
        }), 500

@app.route('/api/leads/enrich', methods=['POST'])
def enrich_leads():
    try:
        data = request.get_json() or {}
        leads_data = data.get('leads', [])
        
        print(f"🔄 Enriching {len(leads_data)} leads")
        
        enriched_results = []
        
        for lead_data in leads_data:
            # Create enriched lead with additional data
            enriched = {
                'company': lead_data['company'],
                'industry': lead_data.get('industry', 'Unknown'),
                'address': lead_data.get('address', ''),
                'phone': lead_data.get('phone'),
                'website': lead_data.get('website', ''),
                'source': lead_data.get('source', 'mock'),
                'created_at': lead_data.get('created_at'),
                
                # Enhanced fields
                'employees': random.randint(10, 500),
                'revenue': random.choice(['$1M-$5M', '$5M-$25M', '$25M+']),
                'founded_year': random.randint(2010, 2020),
                'company_linkedin': f"https://linkedin.com/company/{lead_data['company'].lower().replace(' ', '-')}",
                'activity_score': round(random.uniform(6, 10), 1),
                'fit_score': round(random.uniform(7, 9.5), 1),
                'tags': ['enriched', 'high-priority', 'b2b'],
                'enriched_at': datetime.now().isoformat(),
                'owner_info': {
                    'name': f"Contact at {lead_data['company']}",
                    'email': f"contact@{lead_data['company'].lower().replace(' ', '')}.com",
                    'title': 'Business Development Manager',
                    'linkedin_url': f"https://linkedin.com/in/contact-{lead_data['company'].lower().replace(' ', '-')}"
                }
            }
            enriched_results.append(enriched)
        
        response = {
            'success': True,
            'enriched_leads': enriched_results,
            'count': len(enriched_results)
        }
        
        print(f"✅ Enriched {len(enriched_results)} leads")
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Enrichment error: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e),
            'enriched_leads': [],
            'count': 0
        }), 500

if __name__ == '__main__':
    print("🚀 Starting SaaSquatch Backend...")
    print("📡 API Endpoints:")
    print("   GET  /api/health")
    print("   POST /api/leads/search") 
    print("   POST /api/leads/enrich")
    print("🌐 CORS enabled for frontend")
    app.run(debug=True, port=5000, host='0.0.0.0')