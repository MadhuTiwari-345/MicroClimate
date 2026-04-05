https://ais-dev-dx46xr5zdgrskfd6er4k6h-245177488488.asia-southeast1.run.app/

# 🌍 MicroClimate

**Real-time Micro-Climate Forecasting & Anomaly Detection for Hyper-Local Regions**

MicroClimate is an AI-powered platform designed to monitor, forecast, and analyze **hyper-local weather and climate conditions** at a **1–5 km spatial resolution** — far more granular than traditional city-level forecasts. By combining live atmospheric data, machine learning models, and anomaly detection, MicroClimate provides actionable insights and early risk signals for communities, planners, and researchers.

---

## 🚀 Motivation

Most weather platforms provide coarse-grained forecasts that fail to capture **neighborhood-level variations** caused by urban density, terrain, vegetation, and localized weather phenomena.

MicroClimate bridges this gap by enabling:

* **Localized climate intelligence**
* **Early detection of abnormal weather patterns**
* **Risk-aware decision making** for smart cities, agriculture, and disaster preparedness

---

## ✨ Key Features

### 🌡️ Real-Time Weather Intelligence

* Live ingestion of atmospheric data:

  * Temperature
  * Humidity
  * Pressure
  * Wind speed & direction
* Powered by trusted public weather APIs

### 📍 Hyper-Local Geo Support

* High-precision latitude/longitude-based tracking
* Reverse geocoding to identify the user’s **neighborhood or locality**
* Dynamic location-based weather updates

### 📊 Time-Series Forecasting

* Short-term forecasting using ML-based time-series models (e.g., Prophet)
* Visualized trend predictions for upcoming hours/days
* Adaptive to changing patterns over time

### 🚨 Anomaly Detection Engine

* Detects sudden or unusual climate deviations
* Flags potential risks such as:

  * Sudden temperature spikes/drops
  * Abnormal humidity or pressure changes
* Designed for early warning and monitoring systems

### ⚠️ Risk Scoring System

* Aggregates anomalies and forecast deviations
* Generates a **risk score** indicating potential threat levels
* Useful for decision-making and alerting pipelines

### 🌍 Interactive 3D Visualization

* 3D Earth-based visualization using **Three.js**
* Intuitive and immersive exploration of climate conditions
* Designed for clarity, education, and insight discovery

---

## 🧩 System Architecture

### 🖥 Frontend

* **React + Vite** for fast and modern UI
* **Three.js + React Three Fiber** for 3D Earth visualization
* Responsive design for smooth user interaction

### ⚙️ Backend

* **FastAPI** for high-performance API services
* ML pipelines for:

  * Time-series forecasting
  * Anomaly detection
* Clean RESTful endpoints for integration

### 🌐 Data Sources

* **OpenWeather API** – real-time and historical weather data
* **Nominatim Geo API** – reverse geocoding (location → address)

### 🗄 Storage

* **SQLite** (lightweight local storage)
* Can be extended to PostgreSQL/MySQL for production-scale deployments

### 🚀 Deployment Stack

* Python (FastAPI, ML models)
* Node.js (React frontend)

---

## 🛠 Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/MadhuTiwari-345/MicroClimate.git
cd MicroClimate
```

---

### 2️⃣ Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file and add:

```env
OPENWEATHER_API_KEY=your_openweather_api_key
NOMINATIM_API_KEY=your_nominatim_api_key   # optional
```

Run the backend server:

```bash
uvicorn backend.main:app --reload
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The application will be available at:

```
http://localhost:5173
```

---

## 🧠 Usage

1. Open the frontend application
2. Allow location access for hyper-local detection
3. View:

   * Real-time micro-climate conditions
   * Forecast graphs and trends
   * Anomaly alerts and risk scores
4. Use backend APIs for:

   * Dashboards
   * Smart city tools
   * Research integrations

---

## 📈 Future Enhancements

* 🔌 **IoT Sensor Integration**

  * Street/block-level data ingestion
  * Higher accuracy micro-climate mapping

* 🧠 **Advanced Deep Learning Models**

  * LSTM / Transformer-based forecasting
  * Complex climate pattern recognition

* 🌾 **Domain-Specific Modules**

  * Agriculture advisories
  * Smart city planning tools
  * Energy optimization insights

* 🚨 **Disaster & Emergency Alerts**

  * Government and municipal integrations
  * Real-time early warning systems

---

## 🤝 Contributing

Contributions are welcome and appreciated!
You can help by:

* Reporting bugs
* Suggesting features
* Improving documentation
* Submitting pull requests

Please open an issue or start a discussion before major changes.

---

