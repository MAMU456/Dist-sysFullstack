import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    """Application configuration settings"""
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./distribution.db")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-super-secret-key-change-this-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ADMIN_TOKEN_EXPIRE_MINUTES: int = 60 * 24   # 24 hours for admin
    
    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "https://stupendous-praline-f80270.netlify.app",
        "https://your-frontend-domain.netlify.app"
    ]
    
    # API
    API_VERSION: str = "v1"
    API_PREFIX: str = f"/api/{API_VERSION}"
    
settings = Settings()