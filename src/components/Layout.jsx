import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Layout.css'

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 13h7V4H4v9Zm9 7h7V4h-7v16ZM4 20h7v-5H4v5Z" />
    </svg>
  ),
  sales: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 18h16M7 15V9m5 6V5m5 10v-4" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 6h14M7 12h14M7 18h14M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
  ),
  stock: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3 4 7l8 4 8-4-8-4ZM4 12l8 4 8-4M4 17l8 4 8-4" />
    </svg>
  ),
  warehouse: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 21V9l9-5 9 5v12M7 21v-8h10v8M9 17h6" />
    </svg>
  ),
  purchaseOrders: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 3h9l3 3v15H6V3Zm8 0v4h4M9 12h6M9 16h6" />
    </svg>
  ),
  forecast: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 18 9 12l4 3 7-9M4 21h16" />
    </svg>
  ),
  import: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 21h16" />
    </svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 8h12l1 13H5L6 8Zm3 0a3 3 0 0 1 6 0" />
    </svg>
  ),
}

const Layout = ({ children }) => {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  const navItems = [
    { path: '/dashboard', icon: icons.dashboard, label: 'Dashboard' },
    { path: '/sales', icon: icons.sales, label: 'Sales' },
    { path: '/orders', icon: icons.orders, label: 'Orders' },
    { path: '/stock', icon: icons.stock, label: 'Stock' },
    { path: '/warehouse', icon: icons.warehouse, label: 'Warehouse' },
    { path: '/purchase-orders', icon: icons.purchaseOrders, label: 'POs' },
    { path: '/forecasting', icon: icons.forecast, label: 'Forecast' },
    { path: '/import', icon: icons.import, label: 'Import' },
    { path: '/products', icon: icons.products, label: 'Products' }
  ]
  
  return (
    <div className="layout">
      <header className="header">
        <div className="header-brand">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed((current) => !current)}
            aria-label={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
          >
            <span aria-hidden="true">{sidebarCollapsed ? '›' : '‹'}</span>
          </button>
          <h1>Berry Brazil Acai</h1>
        </div>
      </header>
      
      <div className="layout-body">
        <nav className={`sidebar-nav ${sidebarCollapsed ? 'collapsed' : ''}`}>
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <main className="main-content">
          {children}
        </main>
      </div>
      
      <nav className="bottom-nav">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon" aria-hidden="true">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default Layout
