import re
from typing import Dict, Any


def validate_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Validate phone number format (basic)"""
    # Remove common separators and spaces
    cleaned = re.sub(r'[\s\-\(\)\+]', '', phone)
    # Check if it's a valid phone number (8-15 digits)
    return bool(re.match(r'^\d{8,15}$', cleaned))


def format_currency(amount: float) -> str:
    """Format amount as Kenyan Shillings"""
    return f"Ksh {amount:,.2f}"


def calculate_order_total(items: list) -> float:
    """Calculate total price for order items"""
    return sum(item.get('subtotal', 0) for item in items)


def update_vendor_rating(db, vendor_id: int) -> Dict[str, Any]:
    """Update vendor's average rating after a new rating is added"""
    from sqlalchemy import func
    from models import VendorRating, Vendor
    
    # Calculate new average
    result = db.query(func.avg(VendorRating.rating)).filter(
        VendorRating.vendor_id == vendor_id
    ).scalar()
    
    count = db.query(VendorRating).filter(
        VendorRating.vendor_id == vendor_id
    ).count()
    
    # Update vendor
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if vendor:
        vendor.rating = round(result if result else 5.0, 1)
        vendor.rating_count = count
        db.commit()
        
        return {
            "new_rating": vendor.rating,
            "rating_count": vendor.rating_count
        }
    
    return {"new_rating": 5.0, "rating_count": 0}