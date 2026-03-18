import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_auth/profile")({
  component: RouteComponent,
  beforeLoad({ context }) {
    context.queryClient.invalidateQueries({ queryKey: ["profile"] });
  },
});

function RouteComponent() {
  const { profile } = useAuth();

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Hello, {profile?.email}!</CardTitle>
          <CardDescription>
            Places where you're logged in into To-Do.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Chrome</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-green-500" />
                Current session
              </CardDescription>
              <CardAction>
                <Button variant="outline">Sign out</Button>
              </CardAction>
            </CardHeader>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
