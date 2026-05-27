from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from models import Admin, User, Product, Vendor, Order
from schemas import (
    AdminCreate, Token, ProductCreate, ProductResponse,
    UserResponse, VendorCreate, VendorResponse, AdminStatsResponse
)
from security import (
    hash_password, verify_password, create_admin_token,
    get_current_admin
)

router = APIRouter(prefix="/admin", tags=["Admin"])


# ========== ADMIN SETUP & AUTH ==========
@router.post("/setup")
def setup_admin(admin_data: AdminCreate, db: Session = Depends(get_db)):
    """Create or update admin account (run once for initial setup)"""
    
    existing_admin = db.query(Admin).filter(Admin.username == admin_data.username).first()
    
    if existing_admin:
        # Update existing admin password
        existing_admin.password = hash_password(admin_data.password)
        db.commit()
        return {"message": "Admin password updated successfully"}
    
    # Create new admin
    new_admin = Admin(
        username=admin_data.username,
        password=hash_password(admin_data.password)
    )
    db.add(new_admin)
    db.commit()
    
    return {"message": "Admin created successfully"}


@router.post("/login", response_model=Token)
def admin_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Admin login endpoint"""
    
    admin = db.query(Admin).filter(Admin.username == form_data.username).first()
    
    if not admin or not verify_password(form_data.password, admin.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials"
        )
    
    token = create_admin_token(admin.username)
    
    return {
        "access_token": token,
        "token_type": "bearer"
    }


# ========== PRODUCT MANAGEMENT ==========
@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Create a new product (admin only)"""
    
    new_product = Product(
        name=product_data.name,
        description=product_data.description,
        price=product_data.price
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    return new_product


@router.put("/products/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Update a product (admin only)"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    product.name = product_data.name
    product.description = product_data.description
    product.price = product_data.price
    
    db.commit()
    db.refresh(product)
    
    return product


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Delete a product (admin only)"""
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    db.delete(product)
    db.commit()
    
    return None


# ========== VENDOR MANAGEMENT ==========
@router.get("/vendors", response_model=List[VendorResponse])
def get_vendors(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get all vendors (admin only)"""
    return db.query(Vendor).order_by(Vendor.id).all()


@router.post("/vendors", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(
    vendor_data: VendorCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Create a new vendor (admin only)"""
    
    new_vendor = Vendor(**vendor_data.dict())
    
    db.add(new_vendor)
    db.commit()
    db.refresh(new_vendor)
    
    return new_vendor


@router.put("/vendors/{vendor_id}", response_model=VendorResponse)
def update_vendor(
    vendor_id: int,
    vendor_data: VendorCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Update a vendor (admin only)"""
    
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )
    
    for key, value in vendor_data.dict().items():
        setattr(vendor, key, value)
    
    db.commit()
    db.refresh(vendor)
    
    return vendor


@router.delete("/vendors/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Delete a vendor (admin only)"""
    
    vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )
    
    db.delete(vendor)
    db.commit()
    
    return None


# ========== USER MANAGEMENT ==========
@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get all users (admin only)"""
    return db.query(User).order_by(User.id).all()


@router.patch("/users/{user_id}/revoke")
def revoke_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Revoke a user's access (admin only)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = False
    db.commit()
    
    return {"message": f"User '{user.username}' has been revoked"}


@router.patch("/users/{user_id}/restore")
def restore_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Restore a revoked user's access (admin only)"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.is_active = True
    db.commit()
    
    return {"message": f"User '{user.username}' has been restored"}


# ========== STATISTICS ==========
@router.get("/stats", response_model=AdminStatsResponse)
def get_stats(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get system statistics (admin only)"""
    
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    revoked_users = db.query(User).filter(User.is_active == False).count()
    total_products = db.query(Product).count()
    total_vendors = db.query(Vendor).count()
    total_orders = db.query(Order).count()
    pending_orders = db.query(Order).filter(Order.status == "pending").count()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "revoked_users": revoked_users,
        "total_products": total_products,
        "total_vendors": total_vendors,
        "total_orders": total_orders,
        "pending_orders": pending_orders
    }


# ========== ORDER MANAGEMENT ==========
@router.get("/orders")
def get_all_orders(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Get all orders with user and vendor details (admin only)"""
    
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    result = []
    
    for order in orders:
        user = db.query(User).filter(User.id == order.user_id).first()
        vendor = db.query(Vendor).filter(Vendor.id == order.vendor_id).first()
        
        result.append({
            "id": order.id,
            "username": user.username if user else "Unknown",
            "vendor_name": vendor.name if vendor else "Unknown",
            "delivery_address": order.delivery_address,
            "phone": order.phone,
            "total_price": order.total_price,
            "status": order.status,
            "created_at": order.created_at.strftime("%Y-%m-%d %H:%M"),
            "items": [
                {
                    "product_name": item.product_name,
                    "quantity": item.quantity,
                    "subtotal": item.subtotal
                }
                for item in order.items
            ]
        })
    
    return result


@router.patch("/orders/{order_id}/status")
def update_order_status(
    order_id: int,
    status: str,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    """Update order status (admin only)"""
    
    valid_statuses = ["pending", "confirmed", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    order.status = status
    db.commit()
    
    return {"message": f"Order #{order_id} status updated to '{status}'"}
