import openai
import json
import os
from typing import List, Dict
from models import BaseLead

class SemanticTaggingService:
    def __init__(self):
        # Fix for OpenAI client initialization
        openai.api_key = os.getenv('OPENAI_API_KEY')
        
    def generate_semantic_tags(self, lead: BaseLead, scraped_content: str = None) -> List[str]:
        """Generate semantic tags using OpenAI"""
        
        context = f"""
        Company: {lead.company}
        Industry: {lead.industry}
        Website: {lead.website}
        Size: {getattr(lead, 'employees', 'Unknown')} employees
        Revenue: {getattr(lead, 'revenue', 'Unknown')}
        Business Type: {getattr(lead, 'business_type', 'Unknown')}
        """
        
        if scraped_content:
            context += f"\nWebsite Content: {scraped_content[:500]}..."
        
        prompt = f"""
        Analyze this company and generate 3-5 semantic tags for B2B sales targeting.
        
        {context}
        
        Generate tags for: growth stage, tech maturity, market focus, business characteristics.
        
        Return only a JSON array like: ["high-growth", "tech-forward", "b2b-focused"]
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a B2B sales expert generating precise lead tags."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100,
                temperature=0.3
            )
            
            tags_text = response.choices[0].message.content.strip()
            tags = json.loads(tags_text)
            return tags if isinstance(tags, list) else []
            
        except Exception as e:
            print(f"OpenAI tagging failed: {e}")
            return self._fallback_tags(lead)
    
    def _fallback_tags(self, lead: BaseLead) -> List[str]:
        """Rule-based fallback tagging"""
        tags = []
        
        employees = getattr(lead, 'employees', 0) or 0  # FIX THIS LINE
        if employees < 10:
            tags.append('startup')
        elif employees < 50:
            tags.append('small-business')
        elif employees < 200:
            tags.append('mid-market')
        else:
            tags.append('enterprise')
        
        if lead.industry and lead.industry in ['Technology', 'Software', 'SaaS']:
            tags.extend(['tech-forward', 'digital-native'])
        
        business_type = getattr(lead, 'business_type', '') or ''
        if business_type == 'B2B':
            tags.append('b2b-focused')
        elif business_type == 'B2C':
            tags.append('consumer-facing')
        
        return tags[:5]