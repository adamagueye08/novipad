import { Link } from "@tanstack/react-router";
import { Tablet, ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-subtle">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
              <Tablet className="h-4.5 w-4.5" />
            </span>
            <span className="font-display text-base font-semibold">JokkoTech</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            iPad Apple importés des États-Unis, accessibles au comptant, par épargne Flex ou par
            tontine encadrée. Paiements sécurisés via Wave, Orange Money et carte bancaire.
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> Paiements vérifiés côté serveur
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Navigation</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/catalogue" className="transition-smooth hover:text-foreground">
                Nos iPad
              </Link>
            </li>
            <li>
              <Link to="/formules" className="transition-smooth hover:text-foreground">
                Formules
              </Link>
            </li>
            <li>
              <Link to="/tontines" className="transition-smooth hover:text-foreground">
                Tontines
              </Link>
            </li>
            <li>
              <Link to="/auth" className="transition-smooth hover:text-foreground">
                Mon compte
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Dakar, Sénégal</li>
            <li>contact@ipadrythme.sn</li>
            <li>+221 77 000 00 00</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/60 py-6">
        <p className="container-page text-xs text-muted-foreground">
          © {new Date().getFullYear()} JokkoTech. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
