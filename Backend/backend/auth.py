from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta

router = APIRouter()

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "SECRETKEY123"
ALGO = "HS256"



# PASSWORD HASHING

def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)


def create_token(data: dict):
    expire = datetime.utcnow() + timedelta(hours=5)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGO)



# REGISTER

@router.post("/register")
def register(name: str, email: str, password: str, db: Session = Depends(get_db)):

    user_exist = db.query(User).filter(User.email == email).first()
    if user_exist:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed = hash_password(password)

    new_user = User(
        name=name,
        email=email,
        hashed_password=hashed
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_token({"id": new_user.id})

    return {"message": "User Registered", "token": token}



# LOGIN

@router.post("/login")
def login(email: str, password: str, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Invalid email or password")

    if not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_token({"id": user.id})
    return {"message": "Login Successful", "token": token}
