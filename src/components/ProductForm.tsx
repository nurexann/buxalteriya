"use client";

import { ImagePlus, Save } from "lucide-react";
import { useActionState, useState } from "react";
import { createCategoryAction, createProductAction, updateProductAction } from "@/app/actions/products";
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
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [localCategories, setLocalCategories] = useState(categories);
  const [selectedCategoryId, setSelectedCategoryId] = useState(product?.category_id || "");

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;
    
    setIsCreatingCategory(false);
    
    const formData = new FormData();
    formData.append("name", newCategoryName);
    
    const res = await createCategoryAction(initialActionState, formData);
    
    if (res.ok) {
      // Refresh sahifa yoki UI update. Yaxshisi ID ni olsak.
      const newId = res.categoryId || "temp-" + Date.now(); // Agar ID qaytsa ishlatamiz
      setLocalCategories([...localCategories, { id: newId as string, name: newCategoryName } as CategoryRow]);
      setSelectedCategoryId(newId as string);
      setNewCategoryName("");
    } else {
      setUploadError(res.error || "Kategoriya yaratishda xatolik");
    }
  }

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
            <div className="upload-copy" style={{ flex: 1 }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Rasm URL manzilini kiriting..." 
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImagePath("url_provided");
                }}
                style={{ width: '100%', marginBottom: '8px' }}
              />
              <span className="muted">yoki qurilmadan tanlang (JPG, PNG. Max 5MB)</span>
            </div>
            <label className="ghost-button" htmlFor="image" style={{ whiteSpace: 'nowrap' }}>
              <ImagePlus />
              {uploading ? "..." : "Tanlash"}
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
          <div className="row">
            {!isCreatingCategory ? (
              <>
                <select
                  className="select"
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  id="category_id"
                  name="category_id"
                  style={{ flex: 1 }}
                >
                  <option value="">Kategoriyasiz</option>
                  {localCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="icon-button"
                  title="Yangi kategoriya"
                  onClick={() => setIsCreatingCategory(true)}
                >
                  <span style={{ fontSize: '18px', fontWeight: 'bold' }}>+</span>
                </button>
              </>
            ) : (
              <div className="row" style={{ flex: 1 }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Yangi kategoriya nomi..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  autoFocus
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="button success-button"
                  onClick={handleCreateCategory}
                >
                  Ok
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setIsCreatingCategory(false)}
                >
                  X
                </button>
              </div>
            )}
            {/* Yashirin input orqali asl value yuboriladi */}
            <input type="hidden" name="category_id_override" value={selectedCategoryId} />
          </div>
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
