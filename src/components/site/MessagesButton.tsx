import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function MessagesButton() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const messages = useQuery({
    queryKey: ["my-notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,title,body,created_at,read_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  const unreadCount = (messages.data ?? []).filter((m) => !m.read_at).length;

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["my-notifications", userId] });
  }

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative"
          aria-label="Messages"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border/60 px-4 py-3">
          <p className="text-sm font-semibold">
            Messages{unreadCount > 0 ? ` (${unreadCount} non lu${unreadCount > 1 ? "s" : ""})` : ""}
          </p>
        </div>
        <div className="max-h-96 overflow-y-auto p-2">
          {(messages.data?.length ?? 0) === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">
              Aucun message pour le moment.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {messages.data!.map((m) => (
                <li
                  key={m.id}
                  onClick={() => !m.read_at && markRead(m.id)}
                  className={`cursor-pointer rounded-xl border p-3 transition ${
                    m.read_at ? "border-border/60 bg-transparent" : "border-primary/40 bg-primary/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{m.title}</p>
                    {!m.read_at && (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                  {m.body && <p className="mt-1 text-xs text-muted-foreground">{m.body}</p>}
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {formatDate(m.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
