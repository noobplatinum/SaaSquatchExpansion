import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
import joblib
import os
from typing import Dict, List
from models import BaseLead

class MLScoringService:
    def __init__(self):
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            n_jobs=-1
        )
        self.label_encoders = {}
        self.scaler = StandardScaler()
        self.feature_importance = {}
        self.is_trained = False
        self.model_path = 'models/lead_scorer.joblib'
        
    def extract_features(self, lead: BaseLead) -> Dict:
        """Extract ML features from lead data"""
        return {
            'industry': lead.industry,
            'employees': lead.employees or 10,  
            'has_phone': 1 if lead.phone else 0,
            'has_website': 1 if lead.website else 0,
            'website_length': len(lead.website) if lead.website else 0,
            'company_name_length': len(lead.company),
            'address_state': lead.address.split(',')[-1].strip() if ',' in lead.address else 'Unknown',
            'revenue_category': self._categorize_revenue(getattr(lead, 'revenue', None)),
            'business_type': getattr(lead, 'business_type', 'Unknown'),
            'domain_extension': self._extract_domain_extension(lead.website),
            'company_name_keywords': self._count_tech_keywords(lead.company),
        }
    
    def _categorize_revenue(self, revenue: str) -> str:
        """Categorize revenue into buckets"""
        if not revenue:
            return 'Unknown'
        if '$1M-$5M' in revenue:
            return 'Small'
        elif '$5M-$25M' in revenue:
            return 'Medium'
        elif '$25M+' in revenue:
            return 'Large'
        return 'Startup'
    
    def _extract_domain_extension(self, website: str) -> str:
        """Extract domain extension (.com, .io, etc.)"""
        if not website:
            return 'none'
        try:
            return website.split('.')[-1].lower()
        except:
            return 'unknown'
    
    def _count_tech_keywords(self, company_name: str) -> int:
        """Count technology-related keywords in company name"""
        tech_keywords = ['tech', 'data', 'software', 'digital', 'cloud', 'ai', 'solutions', 'systems']
        return sum(1 for keyword in tech_keywords if keyword.lower() in company_name.lower())
    
    def prepare_training_data(self, leads: List[BaseLead]) -> pd.DataFrame:
        """Convert leads to ML-ready DataFrame"""
        features_list = []
        for lead in leads:
            features = self.extract_features(lead)
            features['target_score'] = self._generate_target_score(features)
            features_list.append(features)
        
        return pd.DataFrame(features_list)
    
    def _generate_target_score(self, features: Dict) -> float:
        """Generate realistic target scores for training"""
        score = 5.0 
        
        high_value_industries = ['Technology', 'Finance', 'Healthcare', 'SaaS']
        if features['industry'] in high_value_industries:
            score += 2.0
        
        if features['employees'] > 100:
            score += 1.5
        elif features['employees'] > 50:
            score += 1.0
        
        revenue_scores = {'Large': 2.0, 'Medium': 1.5, 'Small': 1.0, 'Startup': 0.5}
        score += revenue_scores.get(features['revenue_category'], 0)
        
        score += features['has_phone'] * 0.5
        score += features['has_website'] * 0.5
        
        score += features['company_name_keywords'] * 0.3
        
        if features['business_type'] == 'B2B':
            score += 1.0
        
        score += np.random.normal(0, 0.5)
        
        return min(max(score, 1.0), 10.0)  
    
    def train_model(self, leads: List[BaseLead]):
        """Train the ML model"""
        df = self.prepare_training_data(leads)
        
        feature_cols = [col for col in df.columns if col != 'target_score']
        X = df[feature_cols].copy()
        y = df['target_score']
        
        categorical_cols = ['industry', 'address_state', 'revenue_category', 'business_type', 'domain_extension']
        for col in categorical_cols:
            if col in X.columns:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                self.label_encoders[col] = le
        
        numerical_cols = [col for col in X.columns if col not in categorical_cols]
        X[numerical_cols] = self.scaler.fit_transform(X[numerical_cols])
        
        self.model.fit(X, y)
        self.feature_importance = dict(zip(feature_cols, self.model.feature_importances_))
        self.is_trained = True
        
        os.makedirs('models', exist_ok=True)
        joblib.dump({
            'model': self.model,
            'label_encoders': self.label_encoders,
            'scaler': self.scaler,
            'feature_importance': self.feature_importance
        }, self.model_path)
        
        print(f"Model trained with {len(leads)} leads")
        print("Top feature importance:")
        for feature, importance in sorted(self.feature_importance.items(), key=lambda x: x[1], reverse=True)[:5]:
            print(f"  {feature}: {importance:.3f}")
    
    def predict_score(self, lead: BaseLead) -> float:
        """Predict lead score using trained model"""
        if not self.is_trained:
            self.load_model()
        
        features = self.extract_features(lead)
        df = pd.DataFrame([features])
        
        categorical_cols = ['industry', 'address_state', 'revenue_category', 'business_type', 'domain_extension']
        for col in categorical_cols:
            if col in df.columns and col in self.label_encoders:
                try:
                    df[col] = self.label_encoders[col].transform(df[col].astype(str))
                except ValueError:
                    df[col] = 0
        
        numerical_cols = [col for col in df.columns if col not in categorical_cols]
        df[numerical_cols] = self.scaler.transform(df[numerical_cols])
        
        score = self.model.predict(df)[0]
        return min(max(score, 1.0), 10.0)
    
    def load_model(self):
        """Load trained model"""
        if os.path.exists(self.model_path):
            data = joblib.load(self.model_path)
            self.model = data['model']
            self.label_encoders = data['label_encoders']
            self.scaler = data['scaler']
            self.feature_importance = data['feature_importance']
            self.is_trained = True
            print("Model loaded successfully")
        else:
            print("No trained model found")