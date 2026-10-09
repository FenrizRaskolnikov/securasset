import PocketBase from 'pocketbase';

// Toma la variable de entorno de Vite o se adapta dinámicamente al hostname del navegador
const pbUrl = import.meta.env.PUBLIC_POCKETBASE_URL || 
  (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:8090` : 'http://127.0.0.1:8090');

export const pb = new PocketBase(pbUrl);