import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-12345')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'
    USE_MOCK_DATA = os.getenv('USE_MOCK_DATA', 'true').lower() == 'true'