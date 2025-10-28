/// <reference types="vite/client" />

declare interface ImportMetaEnv {
	readonly VITE_SUPABASE_URL: string;
	readonly VITE_SUPABASE_ANON_KEY: string;
}

declare interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// Vue Router の型拡張
declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    requiresAuth?: boolean;
  }
}