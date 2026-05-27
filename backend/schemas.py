from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional
from datetime import datetime

# ========== AUTH SCHEMAS ==========
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    
    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.isalnum() and not all(c in '_-' for c in v if not c.isalnum()):
            raise ValueError('Username must contain only letters, numbers, underscores, and hyphens')
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None


class AdminCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)


# ========== USER SCHEMAS ==========
class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ========== PRODUCT SCHEMAS ==========
class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1)
    price: float = Field(..., gt=0)
    
    @validator('price')
    def price_positive(cls, v):
        if v <= 0:
            raise ValueError('Price must be greater than 0')
        return v


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    created_at: datetime
    
    class Config:
        from_attributes = True


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)


# ========== VENDOR SCHEMAS ==========
class VendorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    location: str = Field(..., min_length=1)
    hours: str = Field(..., min_length=1)
    phone: str = Field(..., min_length=5)
    email: EmailStr
    rating: float = Field(5.0, ge=0, le=5)
    status: str = Field("open", pattern="^(open|closed)$")
    initials: str = Field(..., min_length=1, max_length=10)


class VendorResponse(BaseModel):
    id: int
    name: str
    location: str
    hours: str
    phone: str
    email: str
    rating: float
    rating_count: int
    status: str
    initials: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class VendorUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    location: Optional[str] = None
    hours: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    rating: Optional[float] = Field(None, ge=0, le=5)
    status: Optional[str] = Field(None, pattern="^(open|closed)$")
    initials: Optional[str] = Field(None, min_length=1, max_length=10)


# ========== ORDER SCHEMAS ==========
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    vendor_id: int
    delivery_address: str = Field(..., min_length=5)
    phone: str = Field(..., min_length=5)
    items: List[OrderItemCreate] = Field(..., min_items=1)


class OrderItemResponse(BaseModel):
    id: int
    product_name: str
    product_price: float
    quantity: int
    subtotal: float
    
    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    vendor_id: int
    delivery_address: str
    phone: str
    total_price: float
    status: str
    created_at: datetime
    items: List[OrderItemResponse]
    
    class Config:
        from_attributes = True


# ========== RATING SCHEMAS ==========
class RatingCreate(BaseModel):
    rating: float = Field(..., ge=1, le=5)


class RatingResponse(BaseModel):
    rating: Optional[float]
    message: str


# ========== ADMIN SCHEMAS ==========
class AdminStatsResponse(BaseModel):
    total_users: int
    active_users: int
    revoked_users: int
    total_products: int
    total_vendors: int
    total_orders: int
    pending_orders: int


class OrderAdminResponse(BaseModel):
    id: int
    username: str
    vendor_name: str
    delivery_address: str
    phone: str
    total_price: float
    status: str
    created_at: str
    items: List[dict]