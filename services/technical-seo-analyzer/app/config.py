import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    """Application settings"""
    
    # API Configuration
    API_V1_PREFIX = "/api/v1"
    PROJECT_NAME = "Technical SEO Analyzer"
    VERSION = "1.0.0"
    
    # CORS
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    
    # Anthropic AI
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    
    # Timeouts
    REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))
    
    # Logging
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    
    # Redis (optional)
    REDIS_URL = os.getenv("REDIS_URL", "")
    
    # Analysis Limits
    MAX_URL_LENGTH = 2048
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB
    
    # SEO Thresholds
    TITLE_MIN_LENGTH = 50
    TITLE_MAX_LENGTH = 60
    DESCRIPTION_MIN_LENGTH = 150
    DESCRIPTION_MAX_LENGTH = 160
    
settings = Settings()
