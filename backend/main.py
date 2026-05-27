from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys

print("[STARTUP] Starting application initialization...", file=sys.stderr)

from config import settings
print(f"[STARTUP] Config loaded. Environment: {settings.ENVIRONMENT}", file=sys.stderr)

from database import init_db
print("[STARTUP] Database module imported", file=sys.stderr)

from routes import (
    auth_router,
    products_router,
    orders_router,
    vendors_router,
    admin_router,
    ratings_router
)
print("[STARTUP] All routers imported", file=sys.stderr)

# Create FastAPI app
app = FastAPI(
    title="Distribution System API",
    description="Backend API for the Distribution System - Connect vendors with customers",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
@app.on_event("startup")
async def startup_event():
    try:
        init_db()
        print("Database initialized successfully")
    except Exception as e:
        print(f"Warning: Database initialization failed: {e}")
        print("Application will continue, but database may not be ready")

# Include routers
app.include_router(auth_router)
app.include_router(products_router)
app.include_router(orders_router)
app.include_router(vendors_router)
app.include_router(admin_router)
app.include_router(ratings_router)


# Root endpoint
@app.get("/")
def root():
    return {
        "message": "Distribution System API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "operational"
    }


# Health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy"}