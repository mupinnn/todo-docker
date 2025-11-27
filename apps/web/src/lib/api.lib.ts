import { hc } from "hono/client";
import type { Api } from "@todo-docker/api";

export const apiClient = hc<Api>(import.meta.env.VITE_API_URL, {
  headers: {
    Authorization: localStorage.getItem("token")
      ? `Bearer ${localStorage.getItem("token")}`
      : "",
  },
});
