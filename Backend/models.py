from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime


# USER TABLE

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # User default location
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # RELATIONSHIPS
    history = relationship("History", back_populates="user")
    saved_locations = relationship("SavedLocation", back_populates="user")



# SAVE MULTIPLE LOCATIONS

class SavedLocation(Base):
    __tablename__ = "saved_locations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    name = Column(String, nullable=False)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    lat = Column(Float, nullable=True)
    lon = Column(Float, nullable=True)

    user = relationship("User", back_populates="saved_locations")



# USER HISTORY

class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    location_id = Column(Integer, ForeignKey("saved_locations.id"), nullable=True)

    timestamp = Column(DateTime, default=datetime.utcnow)

    # AI results
    risk_score = Column(Integer)
    status = Column(String)

    # Full weather API JSON store
    weather_json = Column(Text)

    user = relationship("User", back_populates="history")
