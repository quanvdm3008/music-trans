import type { CSSProperties } from 'react';

/** Inline SVG icon components for MelodyScribe */

interface IconProps {
  className?: string;
  style?: CSSProperties;
}

export function IconMusicNote({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 18V5l12-2v13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

export function IconUpload({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="17,8 12,3 7,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconPlay({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <polygon points="5,3 19,12 5,21"/>
    </svg>
  );
}

export function IconPause({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="4" width="4" height="16" rx="1"/>
      <rect x="14" y="4" width="4" height="16" rx="1"/>
    </svg>
  );
}

export function IconZoomIn({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="11" y1="8" x2="11" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconZoomOut({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="8" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconDownload({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconShare({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
      <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

export function IconTranspose({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="17,1 21,5 17,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="3" y1="5" x2="20" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <polyline points="7,23 3,19 7,15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="21" y1="19" x2="4" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconSync({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="1,4 1,10 7,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="23,20 23,14 17,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconCloud({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconBrain({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 4a4 4 0 014 4c0 1.5-.8 2.8-2 3.5V13h-4v-1.5C8.8 10.8 8 9.5 8 8a4 4 0 014-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 13v2a2 2 0 002 2h0a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="19" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 8.5A6 6 0 016 12M16 8.5A6 6 0 0118 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

export function IconFile({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconChevronDown({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="6,9 12,15 18,9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconWaveform({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="1,12 3,4 5,16 7,8 9,14 11,6 13,18 15,10 17,12 19,5 21,15 23,12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconCheck({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconArrowRight({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <polyline points="12,5 19,12 12,19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconMetronome({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M6 22h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M8 22v-3a4 4 0 014-4h0a4 4 0 014 4v3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      <line x1="12" y1="6" x2="8" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="9" cy="13" r="1" fill="currentColor"/>
    </svg>
  );
}

export function IconChord({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="8" y1="4" x2="8" y2="20" stroke="currentColor" strokeWidth="1"/>
      <line x1="12" y1="4" x2="12" y2="20" stroke="currentColor" strokeWidth="1"/>
      <line x1="16" y1="4" x2="16" y2="20" stroke="currentColor" strokeWidth="1"/>
      <circle cx="6" cy="14" r="1.5" fill="currentColor"/>
      <circle cx="10" cy="11" r="1.5" fill="currentColor"/>
      <circle cx="14" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="18" cy="16" r="1.5" fill="currentColor"/>
    </svg>
  );
}

export function IconLeadSheet({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      <line x1="8" y1="4" x2="8" y2="9" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
      <text x="5" y="14" fontSize="6" fill="currentColor" fontWeight="700" fontFamily="sans-serif">Cmaj7</text>
      <text x="5" y="18" fontSize="3" fill="currentColor" opacity="0.5" fontFamily="sans-serif">Lyrics line here…</text>
    </svg>
  );
}

export function IconStaff({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="3" y1="8" x2="21" y2="8" stroke="currentColor" strokeWidth="0.5" opacity="0.6"/>
      <line x1="3" y1="11" x2="21" y2="11" stroke="currentColor" strokeWidth="0.5" opacity="0.6"/>
      <line x1="3" y1="14" x2="21" y2="14" stroke="currentColor" strokeWidth="0.5" opacity="0.6"/>
      <line x1="3" y1="17" x2="21" y2="17" stroke="currentColor" strokeWidth="0.5" opacity="0.6"/>
      <line x1="3" y1="20" x2="21" y2="20" stroke="currentColor" strokeWidth="0.5" opacity="0.6"/>
      <circle cx="7" cy="12.5" r="1.8" fill="currentColor"/>
      <circle cx="12" cy="15.5" r="1.8" fill="currentColor"/>
      <circle cx="17" cy="9.5" r="1.8" fill="currentColor"/>
    </svg>
  );
}

export function IconTempo({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
      <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 4.5A8 8 0 0116 19.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

export function IconEye({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    </svg>
  );
}

export function IconEyeOff({ className = 'w-6 h-6', style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
