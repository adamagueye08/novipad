import { useQuery } from "@tanstack/react-query";
import { Headphones, Phone, MessageCircle, Mail, Clock } from "lucide-react";
import { settingsQuery } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";

type SupportValue = { phone?: string; whatsapp?: string; email?: string; hours?: string };

export function SupportButton({ className }: { className?: string }) {
  const { data } = useQuery(settingsQuery());
  const support = (data?.["support"] ?? {}) as SupportValue;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={className}
          aria-label="Contacter le support"
        >
          <Headphones className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contacter le support</DialogTitle>
          <DialogDescription>
            Notre équipe vous répond sur l'un des canaux ci-dessous.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {support.phone && (
            <a
              href={`tel:${support.phone}`}
              className="flex items-center gap-3 rounded-2xl border border-border/60 p-3 transition-smooth hover:bg-accent"
            >
              <Phone className="size-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Téléphone</p>
                <p className="text-xs text-muted-foreground">{support.phone}</p>
              </div>
            </a>
          )}
          {support.whatsapp && (
            <a
              href={`https://wa.me/${support.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-border/60 p-3 transition-smooth hover:bg-accent"
            >
              <MessageCircle className="size-4 text-primary" />
              <div>
                <p className="text-sm font-medium">WhatsApp</p>
                <p className="text-xs text-muted-foreground">Discuter directement</p>
              </div>
            </a>
          )}
          {support.email && (
            <a
              href={`mailto:${support.email}`}
              className="flex items-center gap-3 rounded-2xl border border-border/60 p-3 transition-smooth hover:bg-accent"
            >
              <Mail className="size-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-muted-foreground">{support.email}</p>
              </div>
            </a>
          )}
          {support.hours && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" /> {support.hours}
            </p>
          )}
          {!support.phone && !support.whatsapp && !support.email && (
            <p className="text-sm text-muted-foreground">
              Coordonnées bientôt disponibles. Revenez très vite !
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
