/* Жижиг зураасан дүрсүүд (24×24, currentColor) */
const P = {
  // Биднийг сонгосон шалтгаан
  why1: <><path d="M12 3 5 6v5c0 4.4 3 8.3 7 10 4-1.7 7-5.6 7-10V6z" /><path d="m9 12 2 2 4-4" /></>,
  why2: <><circle cx="12" cy="9" r="5" /><path d="m9 13.5-1.5 7.5 4.5-2.5 4.5 2.5-1.5-7.5" /></>,
  why3: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.5" /></>,
  why4: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15M15 6v15" /></>,
  why5: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.9.8 3.1 2.6 3.5 5.2" /></>,
  why6: <><path d="M4 21V5l8-2v18M12 8l8 2v11M3 21h18" /><path d="M7.5 9h1M7.5 13h1M7.5 17h1M15.5 13h1M15.5 17h1" /></>,
  why7: <><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.4l8.8-8.7a5 5 0 0 0 0-7.1z" /></>,
  why8: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /><path d="m9 15 2 2 4-4" /></>,
  why9: <><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>,
  // Бидэнд мэдэгдэх зүйлс
  health: <><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.4l8.8-8.7a5 5 0 0 0 0-7.1z" /><path d="M3.5 12h4l2-3 3 6 2-3h6" /></>,
  allergy: <><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5" /><circle cx="12" cy="16.5" r=".6" /></>,
  diet: <><path d="M6 3v8a2 2 0 0 0 2 2v8M10 3v8a2 2 0 0 1-2 2M8 3v6" /><path d="M17 21V3c-2.2 1.3-3.5 4-3.5 7.5V14H17" /></>,
  mobility: <><circle cx="11" cy="4" r="1.8" /><path d="M11 7v6h5l2 6" /><path d="M11 10h4" /><path d="M8.5 11.5A5.5 5.5 0 1 0 15 18" /></>,
  kids: <><circle cx="12" cy="8" r="4.5" /><path d="M10.3 8.2h.01M13.7 8.2h.01M10.5 10.2c.9.7 2.1.7 3 0" /><path d="M6 21c.5-3.3 3-5.5 6-5.5s5.5 2.2 6 5.5" /></>,
  seat: <><path d="M6 4v9h9l2 7" /><path d="M6 13l-1 7M9 4h-3" /><circle cx="17.5" cy="6.5" r="2.5" /><path d="M14 13.5c.7-2 2-3 3.5-3S20.3 11.5 21 13.5" /></>,
  visa: <><rect x="5" y="2.5" width="14" height="19" rx="2" /><circle cx="12" cy="10" r="3.2" /><path d="M8.8 10h6.4M12 6.8c-1 .9-1.4 2-1.4 3.2s.4 2.3 1.4 3.2M12 6.8c1 .9 1.4 2 1.4 3.2s-.4 2.3-1.4 3.2M9 17h6" /></>,
  first: <><path d="M10.2 13.8 3.5 11l1.6-1.6 6.8.8 4.6-4.6c.9-.9 2.4-1.2 3.1-.5s.4 2.2-.5 3.1l-4.6 4.6.8 6.8-1.6 1.6-2.8-6.7-3.4 3.4.3 2.4-1.2 1.2-1.5-3.1L1.4 17l1.2-1.2 2.4.3z" /></>
};

export default function Icon({ name, className = 'ico' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}
