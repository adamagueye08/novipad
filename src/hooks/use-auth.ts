import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

/**
 * Quand un lien de confirmation email est cliqué une 2e fois (déjà utilisé)
 * ou a expiré, Supabase redirige quand même vers l'app, mais avec l'erreur
 * encodée dans l'URL (#error=...) plutôt qu'une vraie session. Sans ce
 * traitement, l'utilisateur atterrissait silencieusement sur une page qui
 * échoue, sans aucune explication.
 */
function handleAuthRedirectError() {
  const hash = window.location.hash;
  if (!hash.includes("error=")) return;

  const params = new URLSearchParams(hash.slice(1));
  const errorCode = params.get("error_code");
  const message =
    errorCode === "otp_expired"
      ? "Ce lien de confirmation a déjà été utilisé ou a expiré. Si vous avez déjà un compte, connectez-vous directement."
      : "Ce lien n'est plus valide. Merci de réessayer.";

  toast.error(message);
  // Nettoie l'URL pour ne pas réafficher l'erreur si la page est rafraîchie.
  window.history.replaceState(null, "", window.location.pathname);
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, session: null, loading: true });

  useEffect(() => {
    handleAuthRedirectError();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, session, loading: false });
    });

    supabase.auth.getSession().then(({ data }) => {
      setState({ user: data.session?.user ?? null, session: data.session, loading: false });
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return state;
}
