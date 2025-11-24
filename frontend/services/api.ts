const API_BASE_URL = "http://127.0.0.1:8000";

export async function getHello() {
  const response = await fetch(`${API_BASE_URL}/api/hello`);

  if (!response.ok) {
    throw new Error("Failed to fetch from backend");
  }

  const data = await response.json();
  return data; // { message: "Hello from FastAPI 👋" }
}

