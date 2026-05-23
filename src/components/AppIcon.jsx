import './AppIcon.css'

const iconPaths = {
  alert: 'M12 9v4m0 4h.01M10.3 4.3 2.6 18a1.8 1.8 0 0 0 1.6 2.7h15.6a1.8 1.8 0 0 0 1.6-2.7L13.7 4.3a2 2 0 0 0-3.4 0Z',
  box: 'M12 3 4 7l8 4 8-4-8-4ZM4 12l8 4 8-4M4 17l8 4 8-4',
  calendar: 'M7 3v4m10-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z',
  chart: 'M4 18 9 12l4 3 7-9M4 21h16',
  check: 'm5 12 4 4L19 6',
  clipboard: 'M9 5h6M9 12h6M9 16h6M7 4h10v17H7V4Zm3-2h4v4h-4V2Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3 2',
  close: 'm6 6 12 12M18 6 6 18',
  customers: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10.5 8v-1a3 3 0 0 0-2.5-3M16 3.2a4 4 0 0 1 0 7.6',
  document: 'M6 3h9l3 3v15H6V3Zm8 0v4h4M9 12h6M9 16h6',
  download: 'M12 3v12m0 0 4-4m-4 4-4-4M4 21h16',
  edit: 'M4 20h4L19 9l-4-4L4 16v4Zm12-14 4 4',
  file: 'M6 3h9l3 3v15H6V3Zm8 0v4h4',
  folder: 'M3 6h7l2 3h9v11H3V6Z',
  idea: 'M9 18h6M10 22h4M8 14a6 6 0 1 1 8 0c-1 1-1.5 2-1.5 4h-5C9.5 16 9 15 8 14Z',
  import: 'M12 3v12m0 0 4-4m-4 4-4-4M4 21h16',
  location: 'M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  mail: 'M4 6h16v12H4V6Zm0 2 8 5 8-5',
  package: 'M12 3 4 7l8 4 8-4-8-4ZM4 7v10l8 4 8-4V7',
  product: 'M6 8h12l1 13H5L6 8Zm3 0a3 3 0 0 1 6 0',
  refresh: 'M20 6v5h-5M4 18v-5h5M18.5 10A7 7 0 0 0 6 6.5M5.5 14A7 7 0 0 0 18 17.5',
  revenue: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  trendDown: 'M4 6h5l4 5 7-7M20 4v6h-6',
  trendFlat: 'M4 12h16m-4-4 4 4-4 4',
  trendUp: 'M4 18 9 12l4 3 7-9M15 6h5v5',
  truck: 'M3 6h11v10H3V6Zm11 4h4l3 3v3h-7v-6ZM6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
}

export default function AppIcon({ name, className = '', title }) {
  const path = iconPaths[name] || iconPaths.box

  return (
    <span className={`app-icon ${className}`.trim()} title={title} aria-hidden={title ? undefined : 'true'}>
      <svg viewBox="0 0 24 24" role={title ? 'img' : undefined}>
        {title && <title>{title}</title>}
        <path d={path} />
      </svg>
    </span>
  )
}
