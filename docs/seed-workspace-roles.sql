insert into public.roles (key, name, description)
values
  ('owner', 'Owner', 'Workspace owner with full access'),
  ('broker_admin', 'Broker Admin', 'Brokerage administrator'),
  ('team_admin', 'Team Admin', 'Team manager with elevated access'),
  ('agent', 'Agent', 'Standard producing agent'),
  ('coordinator', 'Coordinator', 'Operations and transaction coordinator'),
  ('assistant', 'Assistant', 'Support user with limited access')
on conflict (key) do nothing;
