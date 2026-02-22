import { hc } from "hono/client";
import type { Api } from "@todo-docker/api";

let isRefreshing = false;
let needRefreshRequestsQueue: (() => void)[] = [];
const customFetchDefaultOptions: RequestInit = { credentials: "include" };
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const response = await fetch(input, {
    ...customFetchDefaultOptions,
    ...init,
  });

  if (response.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          {
            credentials: "include",
            method: "POST",
          },
        );

        if (!refreshResponse.ok) throw new Error("Failed refreshing session.");

        needRefreshRequestsQueue.forEach((cb) => cb());
        needRefreshRequestsQueue = [];

        return fetch(input, { ...customFetchDefaultOptions, ...init });
      } catch (error) {
        needRefreshRequestsQueue = [];
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return new Promise<Response>((resolve) => {
      needRefreshRequestsQueue.push(() =>
        resolve(fetch(input, { ...customFetchDefaultOptions, ...init })),
      );
    });
  }

  return response;
};

export const apiClient = hc<Api>(import.meta.env.VITE_API_URL, {
  fetch: customFetch,
});
