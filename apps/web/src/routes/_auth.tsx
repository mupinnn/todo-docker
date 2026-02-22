import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
  useLocation,
} from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_auth")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (!context.auth.profile) {
      throw redirect({
        to: "/login",
      });
    }
  },
});

function RouteComponent() {
  const location = useLocation();
  const activeTab = location.pathname.split("/")[1] ?? "todo";

  return (
    <Tabs defaultValue={activeTab} className="w-full">
      <TabsList>
        <TabsTrigger value="todo" asChild>
          <Link to="/todo">To Do</Link>
        </TabsTrigger>
        <TabsTrigger value="profile" asChild>
          <Link to="/profile">Profile</Link>
        </TabsTrigger>
      </TabsList>

      <Outlet />
    </Tabs>
  );
}
