from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import Vendor, VendorRating, Order, User
from schemas import RatingCreate, RatingResponse
from security import get_current_user
from utils.helpers import update_vendor_rating

router = APIRouter(prefix="/vendors", tags=["Ratings"])


@router.post("/{vendor_id}/rate", response_model=RatingResponse)
def rate_vendor(
    vendor_id: int,
    rating_data: RatingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Rate a vendor (must have placed an order with them)"""
    
    # Check if vendor exists
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )
    
    # Check if user has ordered from this vendor
    has_ordered = db.query(Order).filter(
        Order.user_id == current_user.id,
        Order.vendor_id == vendor_id
    ).first()
    
    if not has_ordered:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only rate vendors you have ordered from"
        )
    
    # Check if rating already exists
    existing_rating = db.query(VendorRating).filter(
        VendorRating.user_id == current_user.id,
        VendorRating.vendor_id == vendor_id
    ).first()
    
    if existing_rating:
        existing_rating.rating = rating_data.rating
        existing_rating.updated_at = func.now()
        db.commit()
    else:
        new_rating = VendorRating(
            user_id=current_user.id,
            vendor_id=vendor_id,
            rating=rating_data.rating
        )
        db.add(new_rating)
        db.commit()
    
    # Update vendor's average rating
    result = update_vendor_rating(db, vendor_id)
    
    return {
        "rating": rating_data.rating,
        "message": "Rating submitted successfully",
        **result
    }


@router.get("/{vendor_id}/my-rating", response_model=RatingResponse)
def get_my_rating(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's rating for a vendor"""
    
    rating = db.query(VendorRating).filter(
        VendorRating.user_id == current_user.id,
        VendorRating.vendor_id == vendor_id
    ).first()
    
    return {
        "rating": rating.rating if rating else None,
        "message": "Rating retrieved successfully"
    }