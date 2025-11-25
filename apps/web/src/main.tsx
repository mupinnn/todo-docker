import "@fontsource/poppins/400.css";
import "@fontsource/poppins/400-italic.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/700-italic.css";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/providers/theme-provider";
import { AuthProvider, useAuth } from "./components/providers/auth-provider";
import { Toaster } from "./components/ui/sonner";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient();
const router = createRouter({
  routeTree,
  context: { auth: undefined!, queryClient },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster position="top-center" />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
