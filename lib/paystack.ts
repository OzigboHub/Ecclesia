const PAYSTACK_BASE_URL = "https://api.paystack.co";
const DEFAULT_DVA_PROVIDER = process.env.PAYSTACK_DVA_PROVIDER_SLUG || "wema-bank";

function getPaystackSecretKey() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }
  return secretKey;
}

export interface PaystackResponse<T = unknown> {
  status: boolean;
  message: string;
  data: T;
}

export class PaystackError extends Error {
  statusCode: number;
  response?: unknown;

  constructor(message: string, statusCode: number, response?: unknown) {
    super(message);
    this.name = "PaystackError";
    this.statusCode = statusCode;
    this.response = response;
  }
}

export interface PaystackResolvedBankAccount {
  account_number: string;
  account_name: string;
}

export interface PaystackCustomerData {
  id: number;
  customer_code: string;
  email: string;
}

export interface PaystackSubaccountData {
  subaccount_code: string;
  business_name: string;
  percentage_charge: number;
}

export interface PaystackTransferRecipientData {
  recipient_code: string;
  name: string;
  type: string;
}

export interface PaystackDedicatedAccountData {
  id: number;
  account_name: string;
  account_number: string;
  assigned: boolean;
  active: boolean;
  bank: {
    name: string;
    slug: string;
  };
}

export interface PaystackInitializeTransactionData {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface PaystackVerifyTransactionData {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  channel: string;
  paid_at?: string | null;
  metadata?: unknown;
}

export interface PaystackTransferData {
  transfer_code: string;
  status: string;
  reference: string;
  amount: number;
}

export async function paystackRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<PaystackResponse<T>> {
  const response = await fetch(`${PAYSTACK_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new PaystackError(
      data?.message || `Paystack API error: ${response.status}`,
      response.status,
      data,
    );
  }

  return data as PaystackResponse<T>;
}

export function nairaToKobo(amount: number) {
  return Math.round(amount * 100);
}

export function koboToNaira(amount: number) {
  return amount / 100;
}

export function generatePaystackReference(prefix: string) {
  const safePrefix = prefix.toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return `${safePrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getDefaultDvaProvider() {
  return DEFAULT_DVA_PROVIDER;
}