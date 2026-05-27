from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import Vendor
from schemas import VendorResponse
from security import optional_auth

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.get("/", response_model=List[VendorResponse])
def get_all_vendors(
    db: Session = Depends(get_db),
    current_user = Depends(optional_auth)  # Public access
):
    """Get all vendors (public access)"""
    vendors = db.query(Vendor).order_by(Vendor.name).all()
    return vendors


@router.get("/{vendor_id}", response_model=VendorResponse)
def get_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(optional_auth)
):
    """Get a specific vendor by ID"""
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )
    return vendor