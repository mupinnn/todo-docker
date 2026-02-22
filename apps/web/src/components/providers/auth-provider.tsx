import { useState, useContext, createContext } from "react";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { type InferResponseType, type InferRequestType } from "hono/client";
import { toast } from "sonner";
import { apiClient } from "@/lib/api.lib";

export interface AuthProviderState {
  isAuthenticated: boolean;
  login: UseMutationResult<
    InferResponseType<typeof apiClient.auth.login.$post>,
    Error,
    InferRequestType<typeof apiClient.auth.login.$post>["json"]
  >;
  logout: () => void;
}

const AuthContext = createContext<AuthProviderState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login: AuthProviderState["login"] = useMutation({
    mutationFn: async (login) => {
      const response = await apiClient.auth.login.$post({ json: login });
      if (!response.ok) throw new Error("Something went wrong");
      return await response.json();
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      setIsAuthenticated(true);
    },
  });

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined)
    throw new Error("useAuth must be used within AuthProvider");
  return context;
}
