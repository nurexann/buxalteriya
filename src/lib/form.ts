export function formText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function formOptionalText(formData: FormData, key: string) {
  const value = formText(formData, key);
  return value ? value : null;
}

export function formNumber(formData: FormData, key: string, fallback = 0) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.trim() === "") {
    return fallback;
  }

  const normalized = Number(value.replaceAll(" ", "").replace(",", "."));
  return Number.isFinite(normalized) ? normalized : fallback;
}

export function formBoolean(formData: FormData, key: string, fallback = false) {
  const value = formData.get(key);

  if (value === null) {
    return fallback;
  }

  return value === "on" || value === "true" || value === "1";
}

export function formNullableUuid(formData: FormData, key: string) {
  const value = formOptionalText(formData, key);
  return value || null;
}

export function formDate(formData: FormData, key: string) {
  const value = formOptionalText(formData, key);

  if (!value) {
    return new Date().toISOString();
  }

  return new Date(value).toISOString();
}
