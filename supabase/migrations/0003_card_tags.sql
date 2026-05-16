-- Replace scalar category/accent columns with a jsonb tags array

alter table cards add column tags jsonb not null default '[]'::jsonb;

update cards
set tags = jsonb_build_array(
  jsonb_build_object('name', category, 'accent', coalesce(accent, '#94a3b8'))
)
where tags = '[]'::jsonb;

alter table cards drop column category;
alter table cards drop column accent;
