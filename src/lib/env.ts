export function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} env qiymati sozlanmagan.`);
  }

  return value;
}

export function getOptionalEnv(name: string): string | undefined {
  return process.env[name] || undefined;
}

export function getSupabaseUrl() {
  return getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabasePublishableKey() {
  return (
    getOptionalEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") ||
    getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}

export function getSupabaseSecretKey() {
  return (
    getOptionalEnv("SUPABASE_SECRET_KEY") ||
    getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY")
  );
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function isSupabaseConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseSecretKey());
}
