import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { type InferRequestType, type InferResponseType } from "hono/client";
import { toast } from "sonner";
import { apiClient } from "@/lib/api.lib";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormField,
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Field, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/register")({
  component: RouteComponent,
  beforeLoad: ({ context }) => {
    if (context.auth.profile) {
      throw redirect({ to: "/" });
    }
  },
});

const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password must be 6 characters length"),
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerMutation = useMutation<
    InferResponseType<typeof apiClient.auth.register.$post>,
    Error,
    InferRequestType<typeof apiClient.auth.register.$post>
  >({
    mutationFn: async (register) => {
      const response = await apiClient.auth.register.$post(register);
      if (!response.ok) throw new Error("Something went wrong");
      return await response.json();
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      toast.success("Account created!");
      navigate({ to: "/login" });
    },
  });

  function onSubmit(values: z.infer<typeof registerSchema>) {
    registerMutation.mutate({ json: values });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your information below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Password"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Field>
                <Button type="submit" disabled={registerMutation.isPending}>
                  Create account
                </Button>
                <FieldDescription className="text-center">
                  Already have an account? <Link to="/login">Sign in</Link>
                </FieldDescription>
              </Field>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
