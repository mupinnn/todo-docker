import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/components/providers/auth-provider";

export const Route = createFileRoute("/_auth/profile")({
  component: RouteComponent,
  beforeLoad({ context }) {
    context.queryClient.invalidateQueries({ queryKey: ["profile"] });
  },
});

function RouteComponent() {
  const { profile } = useAuth();

  return <div>Hello, {profile?.email}!</div>;
}
