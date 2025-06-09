from dataclasses import dataclass, asdict
from typing import Optional, List, Dict
from datetime import datetime
import uuid

@dataclass
class BaseLead:
    """Base lead data from initial search"""
    company: str  # NO DEFAULT - REQUIRED FIELD
    industry: Optional[str] = None
    address: Optional[str] = None
    bbb_rating: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    employees: Optional[int] = None  # ADD THIS LINE
    revenue: Optional[str] = None    # ADD THIS LINE
    business_type: Optional[str] = None  # ADD THIS LINE
    source: str = "mock"
    id: str = None
    created_at: str = None
    
    def __post_init__(self):
        if self.id is None:
            self.id = str(uuid.uuid4())
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()

@dataclass
class OwnerInfo:
    """Owner/Decision maker contact information"""
    name: Optional[str] = None
    email: Optional[str] = None
    linkedin: Optional[str] = None
    title: Optional[str] = None

@dataclass
class EnrichedLead:
    """Enriched lead with additional data"""
    company: str  # NO DEFAULT - REQUIRED
    industry: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    employees: Optional[int] = None
    revenue: Optional[str] = None
    business_type: Optional[str] = None
    fit_score: Optional[float] = None
    tags: Optional[List[str]] = None
    is_enriched: bool = False
    owner_info: Optional[OwnerInfo] = None
    id: str = None  # MOVE TO END
    created_at: str = None  # MOVE TO END
    
    def __post_init__(self):
        if self.id is None:
            self.id = str(uuid.uuid4())
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()
        if self.tags is None:
            self.tags = []