// Premium line-icon set for the admin sidebar — hand-drawn SVG, no icon
// library dependency. Consistent 24x24 viewBox, 1.8 stroke, rounded caps.
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconDashboard(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="7.5" height="9" rx="1.6" />
      <rect x="13.5" y="3" width="7" height="5.5" rx="1.6" />
      <rect x="13.5" y="11" width="7" height="10" rx="1.6" />
      <rect x="3" y="15.5" width="7.5" height="5.5" rx="1.6" />
    </svg>
  );
}

export function IconMessages(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2.2" />
      <path d="M3.5 6.5 12 13l8.5-6.5" />
    </svg>
  );
}

export function IconFaq(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.3 9.4a2.7 2.7 0 0 1 5.1-1.2c.5.9.2 1.7-.7 2.4-1 .8-1.7 1.3-1.7 2.6" />
      <circle cx="12" cy="16.8" r="0.15" fill="currentColor" />
    </svg>
  );
}

export function IconProcess(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9 6h12M9 12h12M9 18h12" />
      <path d="m3 6 1.4 1.4L7 4.8" />
      <path d="m3 12 1.4 1.4L7 10.8" />
      <path d="m3 18 1.4 1.4L7 16.8" />
    </svg>
  );
}

export function IconBuilding(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="9" width="8" height="12" rx="1" />
      <rect x="13" y="3" width="7.5" height="18" rx="1" />
      <path d="M6.5 12.5h2M6.5 15.5h2M6.5 18.5h2" />
      <path d="M15.5 6.5h1.5M15.5 9.5h1.5M15.5 12.5h1.5M15.5 15.5h1.5" />
    </svg>
  );
}

export function IconServices(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6.5 3h7.5l4 4v13a1 1 0 0 1-1 1h-10.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v4h4" />
      <path d="M8.5 12.5h7M8.5 16h7M8.5 9h3" />
    </svg>
  );
}

export function IconWhatsapp(props) {
  return (
    <svg {...base} {...props}>
      <path d="M20.5 11.5a8.5 8.5 0 0 1-12.4 7.6L4 20l1-4A8.5 8.5 0 1 1 20.5 11.5Z" />
      <path d="M8.7 9.3c0-.6.5-1 1-1h.5c.3 0 .5.2.6.4l.6 1.6c.1.2 0 .5-.1.6l-.6.7a5.6 5.6 0 0 0 2.7 2.7l.7-.6c.2-.1.4-.2.6-.1l1.6.6c.2.1.4.3.4.6v.5c0 .5-.4 1-1 1h-.5c-3.5 0-6.7-3.2-6.7-6.7v-.3Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconUsers(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="7.2" r="3.2" />
      <path d="M3.3 20a5.7 5.7 0 0 1 11.4 0" />
      <circle cx="17.3" cy="8.6" r="2.6" />
      <path d="M15.2 20a4.6 4.6 0 0 1 6.8-4" />
    </svg>
  );
}

export function IconSettings(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 13.4a7.7 7.7 0 0 0 0-2.8l2-1.5-2-3.4-2.4.9a7.6 7.6 0 0 0-2.4-1.4L14.2 3H9.8l-.4 2.2a7.6 7.6 0 0 0-2.4 1.4l-2.4-.9-2 3.4 2 1.5a7.7 7.7 0 0 0 0 2.8l-2 1.5 2 3.4 2.4-.9c.7.6 1.5 1.1 2.4 1.4l.4 2.2h4.4l.4-2.2c.9-.3 1.7-.8 2.4-1.4l2.4.9 2-3.4-2-1.5Z" />
    </svg>
  );
}

export function IconActivity(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.7 1.8" />
      <path d="M9.5 3h5" />
      <path d="M12 3v2.2" />
    </svg>
  );
}
