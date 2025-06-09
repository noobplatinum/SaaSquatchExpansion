from typing import List
import random
import uuid
from models import BaseLead

class MockDataService:
    def __init__(self):
        self.companies = [
            "TechFlow Solutions", "DataPipe Inc", "CloudBridge Corp", 
            "StreamLine Systems", "NextGen Analytics", "FlexiCode LLC"
        ]
        self.industries = [
            "Technology", "Software", "SaaS", "E-commerce", "Healthcare", "Finance"
        ]
    
    def generate_leads(self, count: int = 50) -> List[BaseLead]:
        leads = []
        for i in range(count):
            company = random.choice(self.companies)
            industry = random.choice(self.industries) if hasattr(self, 'industries') else 'Technology'
            
            lead = BaseLead(
                company=f"{company} {i+1}",
                industry=industry,
                website=f"https://{company.lower().replace(' ', '')}.com",
                phone=f"+1-555-{random.randint(100,999)}-{random.randint(1000,9999)}",
                address=f"{random.randint(100,9999)} Business St, City, ST 12345",
                employees=random.choice([10, 25, 50, 100, 250, 500]),  # ADD THIS
                revenue=random.choice(["$1M-$5M", "$5M-$25M", "$25M+", "Startup"]),  # ADD THIS
                business_type=random.choice(["B2B", "B2C"])  # ADD THIS
            )
            leads.append(lead)
        
        return leads