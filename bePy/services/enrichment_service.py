from typing import List
from models import BaseLead, EnrichedLead
from .scoring import MLScoringService  # CHANGE THIS LINE

class EnrichmentService:
    def __init__(self):
        self.scorer = MLScoringService()  # CHANGE THIS LINE
    
    def enrich_leads(self, base_leads: List[BaseLead]) -> List[EnrichedLead]:
        """Basic enrichment service"""
        enriched_leads = []
        
        for base_lead in base_leads:
            # Convert BaseLead to EnrichedLead with scoring
            enriched_lead = EnrichedLead(
                company=base_lead.company,
                industry=base_lead.industry,
                website=base_lead.website,
                phone=base_lead.phone,
                address=base_lead.address,
                fit_score=self.scorer.predict_score(base_lead),  # Use ML scoring
                is_enriched=True
            )
            enriched_leads.append(enriched_lead)
        
        return enriched_leads