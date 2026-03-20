import { type InferResponseType, type InferRequestType } from "hono";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
  const { profile, logout } = useAuth();
  const queryClient = useQueryClient();
  const navigate = Route.useNavigate();
  const router = useRouter();

  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    async queryFn() {
      const response = await apiClient.api.sessions.$get();
      if (!response.ok) throw new Error("Error while getting your sessions");
      return await response.json();
    },
  });

  const $revokeSession = apiClient.api.sessions[":sessionId"].$delete;
  const revokeSessionMutation = useMutation<
    InferResponseType<typeof $revokeSession>,
    Error,
    InferRequestType<typeof $revokeSession> & { isCurrent: boolean }
  >({
    async mutationFn(params) {
      const response = await $revokeSession(params);
      if (!response.ok) throw new Error("Error when revoking a session");
      return await response.json();
    },
    onMutate: async (revokedSession) => {
      await queryClient.cancelQueries({ queryKey: ["sessions"] });

      const previousSessions = queryClient.getQueryData<
        InferResponseType<typeof apiClient.api.sessions.$get, 200>
      >(["sessions"]);

      if (previousSessions) {
        queryClient.setQueryData<
          InferResponseType<typeof apiClient.api.sessions.$get, 200>
        >(["sessions"], {
          sessions: previousSessions.sessions.filter(
            (session) => session.id !== revokedSession.param.sessionId,
          ),
        });
      }

      return previousSessions;
    },
    async onSuccess(_, variables) {
      if (variables.isCurrent) {
        await logout();
        await router.invalidate().finally(() => {
          navigate({ to: "/login", replace: true, reloadDocument: true });
        });
      }
    },
    onError(error, _, previousSessions) {
      toast.error(error.message);

      if (previousSessions) {
        queryClient.setQueryData(["sessions"], previousSessions);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["sessions"] }),
  });

  function onRevoke({
    sessionId,
    isCurrent,
  }: {
    sessionId: string;
    isCurrent: boolean;
  }) {
    revokeSessionMutation.mutate({ param: { sessionId }, isCurrent });
  }

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
                    <Button
                      variant="outline"
                      onClick={() =>
                        onRevoke({
                          sessionId: session.id,
                          isCurrent: session.is_current,
                        })
                      }
                    >
                      Sign out
                    </Button>
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
