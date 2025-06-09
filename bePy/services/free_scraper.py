import requests
from bs4 import BeautifulSoup
import time
from typing import List, Optional
from models import BaseLead, EnrichedLead, OwnerInfo

class FreeLeadScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def search_yellow_pages(self, query: str, location: str = "", limit: int = 20) -> List[BaseLead]:
        """Basic web scraping example (often blocked in practice)"""
        print(f"Attempting to scrape for: {query}")
        # In practice, most sites block scraping
        # Return empty list and let app fallback to mock data
        return []
    
    def enrich_with_website_data(self, lead: BaseLead) -> EnrichedLead:
        """Try to enrich lead by visiting their website"""
        enriched = EnrichedLead(
            company=lead.company,
            industry=lead.industry,
            address=lead.address,
            phone=lead.phone,
            website=lead.website,
            source=lead.source
        )
        
        if not lead.website:
            return enriched
        
        try:
            response = self.session.get(lead.website, timeout=5)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Try to extract basic info
            enriched.owner_info = self._extract_contact_info(soup)
            
        except Exception as e:
            print(f"Website enrichment failed for {lead.company}: {e}")
        
        return enriched
    
    def _extract_contact_info(self, soup) -> Optional[OwnerInfo]:
        """Basic contact extraction from website"""
        try:
            # Look for email addresses in text
            text = soup.get_text()
            import re
            emails = re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
            
            if emails:
                return OwnerInfo(email=emails[0])
                
        except Exception:
            pass
        
        return None