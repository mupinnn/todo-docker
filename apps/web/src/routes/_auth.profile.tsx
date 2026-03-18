import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api.lib";

export const Route = createFileRoute("/_auth/profile")({
  component: RouteComponent,
  beforeLoad({ context }) {
    context.queryClient.invalidateQueries({ queryKey: ["profile"] });
  },
});

function RouteComponent() {
  const { profile } = useAuth();

  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    async queryFn() {
      const response = await apiClient.api.sessions.$get();
      if (!response.ok) throw new Error("Error while getting your sessions");
      return await response.json();
    },
  });

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
          {sessionsQuery.isPending ? (
            <Skeleton data-testid="sessions-skeleton" className="h-24" />
          ) : sessionsQuery.isError ? (
            <p>Something went wrong</p>
          ) : (
            sessionsQuery.data.sessions.map((session) => (
              <Card key={session.id}>
                <CardHeader>
                  <CardTitle>
                    {session.user_agent.browser.name} -{" "}
                    {session.user_agent.os.name}
                  </CardTitle>
                  {session.is_current && (
                    <CardDescription className="flex items-center gap-2">
                      <span className="flex size-2 rounded-full bg-green-500" />
                      Current session
                    </CardDescription>
                  )}
                  <CardAction>
                    <Button variant="outline">Sign out</Button>
                  </CardAction>
                </CardHeader>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
