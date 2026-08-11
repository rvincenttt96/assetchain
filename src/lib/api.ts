import type {
  Asset,
  PortfolioItem,
  PurchaseLot,
  Transaction,
  UserActivity
} from "../types";

export const API_BASE = "/api";

export interface BackendProfile {
  id: string;
  name: string;
  email: string;
  usdtBalance: number;
  tomanBalance: number;
  portfolio: PortfolioItem[];
  purchaseLots: PurchaseLot[];
  transactions: Transaction[];
  activities: UserActivity[];
}

type SuccessResponse<T> = {
  success: true;
} & T;

type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {}
): Promise<SuccessResponse<T>> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    }
  });

  const data = (await response.json()) as SuccessResponse<T> | ErrorResponse;

  if (!response.ok || !data.success) {
    const errorData = data as ErrorResponse;
    throw new ApiError(
      response.status,
      errorData.error?.code ?? "REQUEST_FAILED",
      errorData.error?.message ?? "Request failed."
    );
  }

  return data as SuccessResponse<T>;
}

export async function fetchAssetsFromBackend(
  category?: string
): Promise<Asset[]> {
  const query =
    category && category !== "all"
      ? `?category=${encodeURIComponent(category)}`
      : "";

  const result = await request<{ assets: Asset[] }>(`/assets${query}`, {
    method: "GET"
  });

  return result.assets;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<BackendProfile> {
  const result = await request<{ profile: BackendProfile }>(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    }
  );

  return result.profile;
}

export async function loginUser(
  email: string,
  password: string
): Promise<BackendProfile> {
  const result = await request<{ profile: BackendProfile }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  return result.profile;
}

export async function logoutUser(): Promise<void> {
  await request<Record<string, never>>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function getUserProfile(): Promise<BackendProfile> {
  const result = await request<{ profile: BackendProfile }>("/user/profile", {
    method: "GET"
  });

  return result.profile;
}

export async function executeBuyOrder(
  assetId: string,
  shares: number
): Promise<BackendProfile> {
  const result = await request<{ profile: BackendProfile }>("/trades/buy", {
    method: "POST",
    body: JSON.stringify({
      assetId,
      shares,
      idempotencyKey: crypto.randomUUID()
    })
  });

  return result.profile;
}

export async function executeSellOrder(
  assetId: string,
  shares: number
): Promise<BackendProfile> {
  const result = await request<{ profile: BackendProfile }>("/trades/sell", {
    method: "POST",
    body: JSON.stringify({
      assetId,
      shares,
      idempotencyKey: crypto.randomUUID()
    })
  });

  return result.profile;
}
