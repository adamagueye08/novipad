-- Coordonnées du support client, affichées via le bouton "Contacter le
-- support" sur le site public, modifiables depuis /admin/parametres
-- (même mécanisme clé/valeur JSON que company/flex/stock/delivery/terms).
INSERT INTO public.settings (key, value)
VALUES ('support', '{"phone":"+221 77 000 00 00","whatsapp":"221770000000","email":"support@jokkotech.sn","hours":"Lun-Sam, 9h-19h"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
