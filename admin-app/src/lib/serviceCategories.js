// Fixed taxonomy matching the 5 tabs already on the public site.
// Not a separate CRUD (the client only asked for FAQ categories to be
// manageable) — services simply get assigned one of these via a dropdown.
export const SERVICE_CATEGORIES = [
  ['diagnostico', 'Diagnóstico y Certificación'],
  ['licenciamiento', 'Estudios y Licenciamiento'],
  ['monitoreo', 'Monitoreo y Cumplimiento'],
  ['desechos', 'Gestión de Desechos'],
  ['contingencia', 'Planes de Contingencia'],
];

export const SERVICE_CATEGORY_LABEL = Object.fromEntries(SERVICE_CATEGORIES);
