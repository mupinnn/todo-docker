import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { type InferRequestType, type InferResponseType } from "hono/client";
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
import { apiClient } from "@/lib/api.lib";

export const Route = createFileRoute("/_auth/")({
  component: RouteComponent,
});

const todoSchema = z.object({
  task: z.string().min(1, "Minimum 1 character"),
  is_complete: z.boolean().optional(),
});

function RouteComponent() {
  const formCreate = useForm<z.infer<typeof todoSchema>>({
    resolver: zodResolver(todoSchema),
    defaultValues: {
      task: "",
    },
  });

  const $createTodo = apiClient.api.todos.$post;
  const createTodoMutation = useMutation<
    InferResponseType<typeof $createTodo>,
    Error,
    InferRequestType<typeof $createTodo>
  >({
    async mutationFn(todo) {
      const response = await $createTodo(todo);
      if (!response.ok) throw new Error("Error when creating new todo");
      return await response.json();
    },
    onError(error) {
      toast.error(error.message);
    },
    onSuccess() {
      formCreate.reset();
    },
  });

  function onSubmitCreate(values: z.infer<typeof todoSchema>) {
    createTodoMutation.mutate({ json: values });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>To-Do</CardTitle>
          <CardDescription>Please, do something.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...formCreate}>
            <form
              onSubmit={formCreate.handleSubmit(onSubmitCreate)}
              className="space-y-8"
            >
              <FormField
                control={formCreate.control}
                name="task"
                render={({ field }) => (
                  <FormItem className="flex w-full gap-2">
                    <div className="flex flex-col gap-2">
                      <FormControl>
                        <Input
                          placeholder="What are you gonna do?"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </div>
                    <Button disabled={createTodoMutation.isPending}>Add</Button>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
