# Routes package initializer
from routes.auth import router as auth_router
from routes.products import router as products_router
from routes.orders import router as orders_router
from routes.vendors import router as vendors_router
from routes.admin import router as admin_router
from routes.ratings import router as ratings_router

__all__ = [
    'auth_router',
    'products_router',
    'orders_router',
    'vendors_router',
    'admin_router',
    'ratings_router'
]