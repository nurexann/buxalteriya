export type CategoryRow = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by?: string | null;
  delete_reason?: string | null;
};

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  image_url: string | null;
  image_path: string | null;
  purchase_price: number;
  sale_price: number;
  quantity: number;
  min_quantity: number;
  note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  delete_reason: string | null;
  categories?: {
    id: string;
    name: string;
  } | null;
};
