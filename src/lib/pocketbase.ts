import PocketBase from 'pocketbase';

// Lee la variable directamente a través del objeto nativo de Vite
const envUrl = import.meta.env.PUBLIC_POCKETBASE_URL || import.meta.env.VITE_POCKETBASE_URL;

const pbUrl = envUrl || (typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:8090`
  : 'http://127.0.0.1:8090');

export const pb = new PocketBase(pbUrl);