from .mock_data_service import MockDataService  
from .semantic_tagging_service import SemanticTaggingService
from models import BaseLead, EnrichedLead
from .scoring import MLScoringService
from typing import List
import random

class EnhancedMockService(MockDataService):
    def __init__(self):
        super().__init__()
        self.ml_scorer = MLScoringService()
        self.semantic_tagger = SemanticTaggingService()
        self._ensure_model_trained()
    
    def _ensure_model_trained(self):
        """Ensure ML model is trained"""
        if not self.ml_scorer.is_trained:
            print("Training ML model with synthetic data...")
            training_leads = super().generate_leads(1000)  # Generate lots of training data
            self.ml_scorer.train_model(training_leads)
    
    def generate_leads(self, count: int = 50) -> List[BaseLead]:
        """Generate leads with ML scoring and semantic tags"""
        leads = super().generate_leads(count)
        
        enhanced_leads = []
        for lead in leads:
            ml_score = self.ml_scorer.predict_score(lead)
            
            semantic_tags = self.semantic_tagger.generate_semantic_tags(lead)
            
            enhanced_lead = EnrichedLead(
                id=lead.id,
                company=lead.company,
                industry=lead.industry,
                website=lead.website,
                phone=lead.phone,
                address=lead.address,
                employees=getattr(lead, 'employees', None),
                revenue=getattr(lead, 'revenue', None),
                business_type=getattr(lead, 'business_type', None),
                fit_score=ml_score,
                tags=semantic_tags,
                is_enriched=False
            )
            
            enhanced_leads.append(enhanced_lead)
        
        print(f"Generated {count} leads with ML scoring and semantic tagging")
        return enhanced_leads