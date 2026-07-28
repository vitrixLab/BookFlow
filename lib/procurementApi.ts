// lib/procurementApi.ts
const BASE_URL = '/api/service/procurement';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const config: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body) config.body = JSON.stringify(body);

  console.log('Fetching:', `${BASE_URL}${endpoint}`);   // ← temporary debug line
  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || error.message || 'Request failed');
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json();
}

// … keep all the type exports and the procurementApi object exactly as before …
export interface Supplier {
  id: string;
  name: string;
  contact?: string;
  address?: string;
  terms?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierCreate {
  name: string;
  contact?: string;
  address?: string;
  terms?: string;
}

export interface Item {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  quantity: number;
  reorder_point?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ItemCreate {
  name: string;
  sku?: string;
  description?: string;
  reorder_point?: number;
}

export interface PurchaseOrderItem {
  id: string;
  item_id?: string | null;
  title_override?: string | null;
  sku_override?: string | null;
  quantity_ordered: number;
  quantity_received: number;
  item?: Item | null;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  supplier?: Supplier;
  status: 'draft' | 'sent' | 'partially_received' | 'received' | 'cancelled';
  order_date?: string;
  expected_date?: string;
  notes?: string;
  created_by_id: string;
  created_at?: string;
  updated_at?: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderCreate {
  supplier_id: string;
  items: { item_id?: string; title_override?: string; sku_override?: string; quantity_ordered: number }[];
  expected_date?: string;
  notes?: string;
}

export interface ReceiveItemPayload {
  item_id: string;
  quantity_received: number;
}

export const procurementApi = {
  listSuppliers: () => request<Supplier[]>('/suppliers'),
  createSupplier: (data: SupplierCreate) =>
    request<Supplier>('/suppliers', { method: 'POST', body: data }),
  getSupplier: (id: string) => request<Supplier>(`/suppliers/${id}`),
  updateSupplier: (id: string, data: SupplierCreate) =>
    request<Supplier>(`/suppliers/${id}`, { method: 'PUT', body: data }),
  deleteSupplier: (id: string) =>
    request<void>(`/suppliers/${id}`, { method: 'DELETE' }),

  listItems: () => request<Item[]>('/items'),
  createItem: (data: ItemCreate) =>
    request<Item>('/items', { method: 'POST', body: data }),

  listPOs: () => request<PurchaseOrder[]>('/purchase-orders'),
  getPO: (id: string) => request<PurchaseOrder>(`/purchase-orders/${id}`),
  createPO: (data: PurchaseOrderCreate) =>
    request<PurchaseOrder>('/purchase-orders', { method: 'POST', body: data }),
  updatePO: (id: string, data: Partial<PurchaseOrder>) =>
    request<PurchaseOrder>(`/purchase-orders/${id}`, { method: 'PUT', body: data }),
  receiveItems: (poId: string, items: ReceiveItemPayload[]) =>
    request<{ status: string }>(`/purchase-orders/${poId}/receive`, {
      method: 'POST',
      body: items,
    }),
};