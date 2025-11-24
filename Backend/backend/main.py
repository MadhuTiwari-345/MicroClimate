from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from auth import router as auth_router
from weather_router import router as weather_router


# CREATE DATABASE TABLES

Base.metadata.create_all(bind=engine)


# INIT FASTAPI APP

app = FastAPI(
    title="Earth MicroClimate AI",
    description="AI system for microclimate forecasting & risk scoring",
    version="1.0.0"
)


# ENABLE CORS FOR FRONTEND

app.add_middleware(
    CORSMiddleware,
    allow_origins=[ 
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# REGISTER ROUTERS

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(weather_router, prefix="/weather", tags=["Weather"])


# ROOT ROUTE

@app.get("/")
def root():
    return {"message": "MicroClimate AI Backend Running Successfully"}
@app.get("/api/hello")
def hello():
    return {"message": "Hello from FastAPI 👋"}
