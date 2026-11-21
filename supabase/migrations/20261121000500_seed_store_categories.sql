-- Seed the four storefront navigation categories; no products or images are fabricated.
insert into public.categories (name,slug,description,sort_order)
values
  ('Earrings','earrings','Explore earrings in the NAMO NAMO collection.',10),
  ('Necklaces','necklaces','Explore necklaces in the NAMO NAMO collection.',20),
  ('Bangles','bangles','Explore bangles in the NAMO NAMO collection.',30),
  ('Rings','rings','Explore rings in the NAMO NAMO collection.',40)
on conflict (slug) do nothing;
