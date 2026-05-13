"use client";

import { ImagePlus, Save } from "lucide-react";
import { useActionState, useState } from "react";
import { createProductAction, updateProductAction } from "@/app/actions/products";
import { ActionAlert } from "@/components/ActionAlert";
import { SubmitButton } from "@/components/SubmitButton";
import { initialActionState } from "@/lib/errors";
import type { CategoryRow, ProductRow } from "@/lib/types";

type ProductFormProps = {
  categories: CategoryRow[];
  product?: ProductRow;
};

export function ProductForm({ categories, product }: ProductFormProps) {
  const [state, formAction] = useActionState(
    product ? updateProductAction : createProductAction,
    initialActionState
  );
  const [imageUrl, setImageUrl] = useState(product?.image_url || "");
  const [imagePath, setImagePath] = useState(product?.image_path || "");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  async function uploadImage(file: File) {
    setUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/storage/product-image", {
      method: "POST",
      body: formData
    });
    const json = (await response.json()) as {
      url?: string;
      path?: string;
      error?: string;
    };

    setUploading(false);

    if (!response.ok || !json.url || !json.path) {
      setUploadError(json.error || "Rasm yuklashda xatolik yuz berdi.");
      return;
    }

    setImageUrl(json.url);
    setImagePath(json.path);
  }

  return (
    <form action={formAction} className="form-card stack">
      <ActionAlert state={state} />
      {uploadError ? <div className="action-alert error">{uploadError}</div> : null}

      {product ? <input name="product_id" type="hidden" value={product.id} /> : null}
      <input name="image_url" type="hidden" value={imageUrl} />
      <input name="image_path" type="hidden" value={imagePath} />

      <div className="form-grid">
        <div className="field full">
          <label htmlFor="image">Tovar rasmi</label>
          <div className="upload-panel">
            {imageUrl ? (
              <img alt="" className="product-image" src={imageUrl} />
            ) : (
              <span className="image-placeholder">Rasm</span>
            )}
            <div className="upload-copy">
              <strong>Mahsulot rasmi</strong>
              <span className="muted">JPG, PNG, WEBP yoki GIF. Limit: 5 MB.</span>
            </div>
            <label className="ghost-button" htmlFor="image">
              <ImagePlus />
              {uploading ? "Yuklanmoqda..." : "Rasm tanlash"}
            </label>
            <input
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              id="image"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void uploadImage(file);
                }
              }}
              type="file"
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="name">Tovar nomi</label>
          <input
            className="input"
            defaultValue={product?.name || ""}
            id="name"
            name="name"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="sku">SKU / unikal nom</label>
          <input
            className="input"
            defaultValue={product?.sku || ""}
            id="sku"
            name="sku"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="category_id">Kategoriya</label>
          <select
            className="select"
            defaultValue={product?.category_id || ""}
            id="category_id"
            name="category_id"
          >
            <option value="">Kategoriyasiz</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="purchase_price">Xarid narxi</label>
          <input
            className="input"
            defaultValue={product?.purchase_price || 0}
            id="purchase_price"
            min="0"
            name="purchase_price"
            step="0.01"
            type="number"
          />
        </div>

        <div className="field">
          <label htmlFor="sale_price">Sotuv narxi</label>
          <input
            className="input"
            defaultValue={product?.sale_price || 0}
            id="sale_price"
            min="0"
            name="sale_price"
            step="0.01"
            type="number"
          />
        </div>

        {!product ? (
          <div className="field">
            <label htmlFor="initial_quantity">Boshlang'ich soni</label>
            <input
              className="input"
              defaultValue="0"
              id="initial_quantity"
              min="0"
              name="initial_quantity"
              step="0.001"
              type="number"
            />
          </div>
        ) : (
          <input name="initial_quantity" type="hidden" value="0" />
        )}

        <div className="field">
          <label htmlFor="min_quantity">Minimal qoldiq</label>
          <input
            className="input"
            defaultValue={product?.min_quantity || 0}
            id="min_quantity"
            min="0"
            name="min_quantity"
            step="0.001"
            type="number"
          />
        </div>

        <div className="field">
          <label htmlFor="is_active">Holat</label>
          <select
            className="select"
            defaultValue={product?.is_active === false ? "false" : "true"}
            id="is_active"
            name="is_active"
          >
            <option value="true">Aktiv</option>
            <option value="false">Arxiv</option>
          </select>
        </div>

        <div className="field full">
          <label htmlFor="note">Izoh</label>
          <textarea
            className="textarea"
            defaultValue={product?.note || ""}
            id="note"
            name="note"
          />
        </div>
      </div>

      <SubmitButton>
        <Save />
        {product ? "Saqlash" : "Qo'shish"}
      </SubmitButton>
    </form>
  );
}
