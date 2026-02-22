import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { type InferRequestType, type InferResponseType } from "hono/client";
import { TrashIcon, CircleCheckIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { apiClient } from "@/lib/api.lib";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_auth/todo")({
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

  const queryClient = useQueryClient();
  const todosQuery = useQuery({
    queryKey: ["todos"],
    async queryFn() {
      const response = await apiClient.api.todos.$get();
      if (!response.ok) throw new Error("Error while getting your todos");
      return await response.json();
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
    onMutate: async (newTodo) => {
      formCreate.reset();
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      const previousTodos = queryClient.getQueryData<
        InferResponseType<typeof apiClient.api.todos.$get, 200>
      >(["todos"]);

      if (previousTodos) {
        const optimisticTodo = {
          id: Date.now().toString(),
          user_id: "",
          task: newTodo.json.task,
          is_complete: false,
          created_at: new Date().toISOString(),
          updated_at: null,
        };
        queryClient.setQueryData<
          InferResponseType<typeof apiClient.api.todos.$get, 200>
        >(["todos"], { todos: [...previousTodos.todos, optimisticTodo] });
      }

      return previousTodos;
    },
    onError: (error, _, previousTodos) => {
      toast.error(error.message);

      if (previousTodos) {
        queryClient.setQueryData(["todos"], previousTodos);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const $deleteTodo = apiClient.api.todos[":id"].$delete;
  const deleteTodoMutation = useMutation<
    InferResponseType<typeof $deleteTodo>,
    Error,
    InferRequestType<typeof $deleteTodo>
  >({
    async mutationFn(params) {
      const response = await $deleteTodo(params);
      if (!response.ok) throw new Error("Error when deleting a todo");
      return await response.json();
    },
    onMutate: async (deletedTodo) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      const previousTodos = queryClient.getQueryData<
        InferResponseType<typeof apiClient.api.todos.$get, 200>
      >(["todos"]);

      if (previousTodos) {
        queryClient.setQueryData<
          InferResponseType<typeof apiClient.api.todos.$get, 200>
        >(["todos"], {
          todos: previousTodos.todos.filter(
            (todo) => todo.id !== deletedTodo.param.id,
          ),
        });
      }

      return previousTodos;
    },
    onError(error, _, previousTodos) {
      toast.error(error.message);

      if (previousTodos) {
        queryClient.setQueryData(["todos"], previousTodos);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  const $updateTodo = apiClient.api.todos[":id"].$patch;
  const updateTodoMutation = useMutation<
    InferResponseType<typeof $updateTodo>,
    Error,
    InferRequestType<typeof $updateTodo>
  >({
    async mutationFn(updatedTodo) {
      const response = await $updateTodo(updatedTodo);
      if (!response.ok) throw new Error("Error when updating a todo");
      return await response.json();
    },
    onMutate: async (updatedTodo) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });

      const previousTodos = queryClient.getQueryData<
        InferResponseType<typeof apiClient.api.todos.$get, 200>
      >(["todos"]);

      if (previousTodos) {
        const optimisticTodos = previousTodos.todos.map((todo) => {
          if (todo.id === updatedTodo.param.id) {
            return {
              ...todo,
              ...updatedTodo.json,
            };
          }

          return todo;
        });

        queryClient.setQueryData<
          InferResponseType<typeof apiClient.api.todos.$get, 200>
        >(["todos"], { todos: optimisticTodos });
      }

      return previousTodos;
    },
    onError(error, _, previousTodos) {
      toast.error(error.message);

      if (previousTodos) {
        queryClient.setQueryData(["todos"], previousTodos);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });

  function onSubmitCreate(values: z.infer<typeof todoSchema>) {
    createTodoMutation.mutate({ json: values });
  }

  function onDelete(id: string) {
    deleteTodoMutation.mutate({ param: { id } });
  }

  function onTodoChecked(checked: boolean | "indeterminate", id: string) {
    if (typeof checked === "boolean") {
      updateTodoMutation.mutate({
        json: { is_complete: checked },
        param: { id },
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>To-Do</CardTitle>
          <CardDescription>Please, do something.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
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

          {todosQuery.isPending && <Skeleton className="h-40" />}
          {todosQuery.isError && <p>Something went wrong.</p>}
          {todosQuery.isPending ? (
            <Skeleton className="h-40" />
          ) : todosQuery.isError ? (
            <p>Something went wrong</p>
          ) : todosQuery.data.todos.length > 0 ? (
            <div className="flex flex-col gap-2">
              {todosQuery.data.todos.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-2 justify-between"
                >
                  <p className={todo.is_complete ? "line-through" : ""}>
                    {todo.task}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => onDelete(todo.id)}
                    >
                      <TrashIcon />
                    </Button>
                    <Checkbox
                      checked={todo.is_complete}
                      onCheckedChange={(c) => onTodoChecked(c, todo.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CircleCheckIcon />
                </EmptyMedia>
                <EmptyTitle>Nothing todo yet</EmptyTitle>
                <EmptyDescription>Add something todo</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
