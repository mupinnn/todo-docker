import { useContext, createContext } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { LoaderIcon } from "lucide-react";
import { type InferResponseType, type InferRequestType } from "hono/client";
import { toast } from "sonner";
import { apiClient } from "@/lib/api.lib";

export interface AuthProviderState {
  profile?: InferResponseType<
    typeof apiClient.api.profile.$get,
    200
  >["profile"];
  login: UseMutationResult<
    InferResponseType<typeof apiClient.auth.login.$post>,
    Error,
    InferRequestType<typeof apiClient.auth.login.$post>["json"]
  >;
  logout: () => void;
}

const AuthContext = createContext<AuthProviderState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    async queryFn() {
      const response = await apiClient.api.profile.$get();
      if (!response.ok) throw new Error("Error while getting your profile");
      return await response.json();
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const logout = () => {};

  if (profileQuery.isLoading)
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <LoaderIcon className="animate-spin" />
      </div>
    );

  return (
    <AuthContext.Provider
      value={{ profile: profileQuery.data?.profile, login, logout }}
    >
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
