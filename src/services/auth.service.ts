import { PublicClientApplication } from "@azure/msal-browser";

const env = (
  import.meta as ImportMeta & {
    env: Record<string, string | undefined>;
  }
).env;

const msalConfig = {
  auth: {
    clientId: env.VITE_MS_CLIENT_ID || "",
    authority:
      env.VITE_MS_AUTHORITY || "https://login.microsoftonline.com/common",
    redirectUri: env.VITE_MS_REDIRECT_URI || "/auth/callback",
  },
};

const loginRequest = {
  scopes: ["openid", "profile", "email"],
};

export const allowedDomains = ["@phuongdong.edu.vn", "@pduni.edu.vn"];
export function validateInstitutionEmail(email: string) {
  return allowedDomains.some((domain) => email.toLowerCase().endsWith(domain));
}

export async function mockSignIn(email: string, password: string) {
  await new Promise((r) => setTimeout(r, 500));
  if (!validateInstitutionEmail(email) || password.length < 6)
    throw new Error(
      "Use your institutional email and a password with at least 6 characters.",
    );
  return { email };
}

const MS_AUTH_MODE = env.VITE_MS_AUTH_MODE || "mock";

export const msalInstance =
  MS_AUTH_MODE === "real" ? new PublicClientApplication(msalConfig) : null;
let msalInitialized: Promise<void> | null = null;

function ensureMsalInitialized() {
  if (!msalInstance) throw new Error("MSAL chưa được cấu hình.");
  if (!msalInitialized) msalInitialized = msalInstance.initialize();
  return msalInitialized;
}

// Bắt đầu luồng đăng nhập Microsoft
export async function signInWithMicrosoft() {
  if (MS_AUTH_MODE === "mock") {
    const redirectUri = "/auth/callback";
    window.location.href = `/mock-microsoft-login?redirect_uri=${encodeURIComponent(redirectUri)}`;
    return;
  }
  await ensureMsalInitialized();
  await msalInstance!.loginRedirect(loginRequest);
}

// Gọi sau khi quay lại /auth/callback (từ Microsoft thật hoặc trang mock)
export async function completeMicrosoftLogin(searchParams: URLSearchParams) {
  let endpoint = "/api/auth/microsoft";
  let body: Record<string, string>;

  if (MS_AUTH_MODE === "mock") {
    const email = searchParams.get("mock_email");
    const name = searchParams.get("mock_name") || "";
    if (!email) throw new Error("Không nhận được thông tin từ bước giả lập.");
    endpoint = "/api/auth/microsoft/mock";
    body = { email, name };
  } else {
    await ensureMsalInitialized();
    const result = await msalInstance!.handleRedirectPromise();
    if (!result || !result.idToken) {
      throw new Error("Không nhận được thông tin đăng nhập từ Microsoft.");
    }
    body = { id_token: result.idToken };
  }

  const res = await fetch(`${env.VITE_API_BASE_URL || ""}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      errBody.detail || "Tài khoản Microsoft không được cấp phép.",
    );
  }

  return res.json();
}
