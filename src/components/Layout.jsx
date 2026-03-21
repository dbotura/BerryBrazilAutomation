import { Link, useLocation } from 'react-router-dom'
import './Layout.css'

const Layout = ({ children }) => {
  const location = useLocation()
  
  const navItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/sales', icon: '💰', label: 'Sales' },
    { path: '/orders', icon: '📋', label: 'Orders' },
    { path: '/stock', icon: '📦', label: 'Stock' },
    { path: '/warehouse', icon: '🏭', label: 'Warehouse' },
    { path: '/purchase-orders', icon: '📝', label: 'POs' },
    { path: '/forecasting', icon: '📈', label: 'Forecast' },
    { path: '/import', icon: '📥', label: 'Import' },
    { path: '/products', icon: '🫐', label: 'Products' }
  ]
  
  return (
    <div className="layout">
      <header className="header">
        <h1>🫐 Berry Brazil Açai</h1>
      </header>
      
      <div className="layout-body">
        {/* Desktop sidebar navigation */}
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <main className="main-content">
          {children}
        </main>
      </div>
      
      {/* Mobile bottom navigation */}
      <nav className="bottom-nav">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default Layout
