/* Скопируй этот файл как cloud-config.js и подставь ключи из Supabase.
   cloud-config.js можно коммитить с anon-ключом (он публичный).
   Не клади сюда service_role и ADMIN_PASSWORD. */
window.CloudConfig = {
  enabled: true,
  url: "https://YOUR_PROJECT.supabase.co",
  anonKey: "YOUR_ANON_KEY",
  // Пусто = админка через SQL RPC (рекомендуется). Edge Function не обязательна.
  adminFn: "",
  heartbeatMs: 9000,
};
