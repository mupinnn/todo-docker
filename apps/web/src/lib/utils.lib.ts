import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEnv<K extends keyof ImportMetaEnv>(key: K) {
  const envMap = {
    BASE_URL: import.meta.env.BASE_URL,
    DEV: import.meta.env.DEV,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
    SSR: import.meta.env.SSR,
    VITE_API_URL: import.meta.env.VITE_API_URL,
  } satisfies ImportMetaEnv;

  return window?.env?.[key] ?? envMap[key];
}
