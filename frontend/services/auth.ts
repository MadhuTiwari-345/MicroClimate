const API_BASE_URL = "http://127.0.0.1:8000";

// REGISTER USER
export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const url = new URL("/auth/register", API_BASE_URL);
  url.searchParams.set("name", name);
  url.searchParams.set("email", email);
  url.searchParams.set("password", password);

  const res = await fetch(url.toString(), { method: "POST" });

  if (!res.ok) {
    throw new Error("Failed to register");
  }

  return res.json(); // { message, token }
}

// LOGIN USER
export async function loginUser(email: string, password: string) {
  const url = new URL("/auth/login", API_BASE_URL);
  url.searchParams.set("email", email);
  url.searchParams.set("password", password);

  const res = await fetch(url.toString(), { method: "POST" });

  if (!res.ok) {
    throw new Error("Failed to login");
  }

  return res.json(); // { message, token }
}
