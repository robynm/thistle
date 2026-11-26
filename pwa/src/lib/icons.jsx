// Inline Lucide-style icons: 24×24 viewBox, stroked with currentColor so they take the
// text color. Only the icons the app uses are here; copy more path data in as needed.

function Icon({ size = 20, strokeWidth = 2, fill = "none", className = "", children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const make = (children, defaults = {}) => {
  const Named = (props) => <Icon {...defaults} {...props}>{children}</Icon>;
  return Named;
};

const I = {
  plus: make(<path d="M5 12h14M12 5v14" />),
  minus: make(<path d="M5 12h14" />),
  x: make(<path d="M18 6 6 18M6 6l12 12" />),
  check: make(<path d="M20 6 9 17l-5-5" />),
  more: make(<><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>),
  play: make(<polygon points="6 3 20 12 6 21 6 3" />, { fill: "currentColor" }),
  pause: make(<><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></>, { fill: "currentColor" }),
  skipForward: make(<><polygon points="5 4 15 12 5 20 5 4" fill="currentColor" /><path d="M19 5v14" /></>),
  skipBack: make(<><polygon points="19 20 9 12 19 4 19 20" fill="currentColor" /><path d="M5 19V5" /></>),
  timer: make(<><path d="M10 2h4M12 14l3-3" /><circle cx="12" cy="14" r="8" /></>),
  hash: make(<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />),
  history: make(<><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5M12 7v5l4 2" /></>),
  trash: make(<path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />),
  copy: make(<><rect x="8" y="8" width="14" height="14" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>),
  chevronUp: make(<path d="m18 15-6-6-6 6" />),
  chevronDown: make(<path d="m6 9 6 6 6-6" />),
  chevronRight: make(<path d="m9 18 6-6-6-6" />),
  grip: make(<><circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" /></>),
  pencil: make(<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />),
  folderPlus: make(<path d="M12 10v6M9 13h6M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />),
  download: make(<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />),
  upload: make(<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />),
  sun: make(<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" /></>),
  moon: make(<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />),
  volume: make(<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" /></>),
  volumeOff: make(<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M22 9l-6 6M16 9l6 6" /></>),
  repeat: make(<path d="m17 2 4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3" />),
  smartphone: make(<><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></>),
  wifiOff: make(<path d="M2 2l20 20M8.5 16.5a5 5 0 0 1 7 0M2 8.82a15 15 0 0 1 4.17-2.65M10.66 5c4.01-.36 8.14.9 11.34 3.76M16.85 11.25a10 10 0 0 1 2.22 1.68M5 13a10 10 0 0 1 5.24-2.76M12 20h.01" />),
  bell: make(<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />),
  share: make(<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />),
};

export { Icon, I };
