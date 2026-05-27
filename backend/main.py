from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db
from routes import (
    auth_router,
    products_router,
    orders_router,
    vendors_router,
    admin_router,
    ratings_router
)

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
    init_db()
    print("Database initialized successfully")

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