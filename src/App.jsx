import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Sales from './pages/Sales'
import Orders from './pages/Orders'
import Stock from './pages/Stock'
import Warehouse from './pages/Warehouse'
import Forecasting from './pages/Forecasting'
import PurchaseOrders from './pages/PurchaseOrders'
import ImportData from './pages/ImportData'
import Reports from './pages/Reports'
import './App.css'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/warehouse" element={<Warehouse />} />
          <Route path="/forecasting" element={<Forecasting />} />
          <Route path="/purchase-orders" element={<PurchaseOrders />} />
          <Route path="/import" element={<ImportData />} />
          <Route path="/products" element={<Products />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
