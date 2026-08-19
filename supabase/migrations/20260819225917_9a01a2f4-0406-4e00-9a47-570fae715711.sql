INSERT INTO public.products (slug, model, generation, storage, color, connectivity, condition, warranty_months, description, features, images, price_cash, price_tontine, price_flex, stock_quantity, is_demo) VALUES
('ipad-10-64-wifi-argent','iPad','10e génération','64 Go','Argent','Wi-Fi','Comme neuf (US)',6,'iPad 10e génération importé des États-Unis, écran Liquid Retina 10,9 pouces, puce A14 Bionic. Testé et garanti.','["Écran Liquid Retina 10,9\"","Puce A14 Bionic","Caméra 12 MP","USB-C","Compatible Apple Pencil (1re gén.)"]'::jsonb,'{}',260000,270000,275000,8,true),
('ipad-9-64-wifi-gris','iPad','9e génération','64 Go','Gris sidéral','Wi-Fi','Très bon état (US)',6,'iPad 9e génération, écran Retina 10,2 pouces, puce A13 Bionic. Idéal pour les études et le travail.','["Écran Retina 10,2\"","Puce A13 Bionic","Touch ID","Compatible Smart Keyboard"]'::jsonb,'{}',260000,270000,275000,5,true),
('ipad-air-4-64-wifi-bleu','iPad Air','4e génération','64 Go','Bleu ciel','Wi-Fi','Comme neuf (US)',6,'iPad Air 4, design tout écran 10,9 pouces, puce A14 Bionic et Touch ID intégré au bouton.','["Écran Liquid Retina 10,9\"","Puce A14 Bionic","Touch ID latéral","Apple Pencil 2"]'::jsonb,'{}',315000,325000,330000,3,true),
('ipad-mini-6-64-wifi-rose','iPad mini','6e génération','64 Go','Rose','Wi-Fi','Comme neuf (US)',6,'iPad mini 6 ultra-compact, écran 8,3 pouces, puce A15 Bionic. Puissance dans la poche.','["Écran Liquid Retina 8,3\"","Puce A15 Bionic","USB-C","Apple Pencil 2"]'::jsonb,'{}',330000,340000,345000,2,true);

INSERT INTO public.tontines (name, product_id, member_capacity, price, contribution_amount, frequency, duration_months, start_date, end_date, allocation_rules, ipads_available, terms, status, is_demo)
SELECT 'Tontine iPad Dakar — Septembre', p.id, 10, 270000, 27000, 'MONTHLY', 10, CURRENT_DATE, CURRENT_DATE + INTERVAL '10 months',
'Attribution par ordre d''ancienneté d''adhésion, une fois les cotisations du cycle encaissées.', 10,
'Cotisation mensuelle de 27 000 FCFA pendant 10 mois. Tout retard de plus de 7 jours entraîne une pénalité. L''iPad est remis lorsque le cycle d''attribution du membre est atteint. En cas d''abandon, les sommes versées sont remboursées après déduction des frais de gestion.',
'OPEN', true FROM public.products p WHERE p.slug = 'ipad-10-64-wifi-argent';

INSERT INTO public.tontines (name, product_id, member_capacity, price, contribution_amount, frequency, duration_months, start_date, end_date, allocation_rules, ipads_available, terms, status, is_demo)
SELECT 'Tontine iPad Étudiants — Hebdo', p.id, 12, 270000, 6750, 'WEEKLY', 10, CURRENT_DATE, CURRENT_DATE + INTERVAL '10 months',
'Attribution par tirage encadré à chaque fin de cycle, réservée aux membres à jour de cotisations.', 12,
'Cotisation hebdomadaire de 6 750 FCFA pendant 40 semaines. Deux retards consécutifs entraînent une suspension temporaire. L''iPad est remis à 100 % des cotisations du cycle.',
'OPEN', true FROM public.products p WHERE p.slug = 'ipad-9-64-wifi-gris';
