import { useState } from 'react'
import AppIcon from '../components/AppIcon'
import { formatCurrency, formatDate } from '../utils/currency'
import './ImportData.css'

const ImportData = () => {
  const [activeTab, setActiveTab] = useState('sales')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      parseCSV(selectedFile)
    } else {
      alert('Please select a valid CSV file')
    }
  }
  
  const parseCSV = (file) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target.result
      const lines = text.split('\n')
      const headers = lines[0].split(',').map(h => h.trim())
      
      const data = []
      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim())
          const row = {}
          headers.forEach((header, index) => {
            row[header] = values[index]
          })
          data.push(row)
        }
      }
      setPreview(data)
    }
    reader.readAsText(file)
  }
  
  const handleImport = async () => {
    if (!file) {
      alert('Please select a file first')
      return
    }
    
    setImporting(true)
    
    // Simulate import process - replace with actual API call
    setTimeout(() => {
      setImportResult({
        success: true,
        imported: preview.length,
        errors: 0
      })
      setImporting(false)
      setFile(null)
      setPreview([])
    }, 2000)
  }
  
  const downloadTemplate = (type) => {
    let csvContent = ''
    
    if (type === 'sales') {
      csvContent = 'date,product_name,quantity,unit_price,total,customer\n'
      csvContent += '2026-01-31,Açai Bowl 300g,2,15.00,30.00,John Smith\n'
      csvContent += '2026-01-31,Açai Smoothie,1,12.00,12.00,Jane Doe\n'
    } else if (type === 'products') {
      csvContent = 'name,category,price,stock,min_stock\n'
      csvContent += 'Açai Bowl 300g,Bowls,15.00,45,20\n'
      csvContent += 'Açai Smoothie,Smoothies,12.00,28,15\n'
    } else if (type === 'stock') {
      csvContent = 'product_name,quantity,type,reason,notes\n'
      csvContent += 'Açai Bowl 300g,50,receive,Supplier delivery,Batch #123\n'
      csvContent += 'Açai Powder 100g,-2,adjustment,Damaged items,Expired\n'
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_template.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }
  
  return (
    <div className="import-data">
      <h2 className="page-title">Import Data</h2>
      
      <div className="import-tabs">
        <button 
          className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          <AppIcon name="chart" className="icon-inline" />Sales History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <AppIcon name="product" className="icon-inline" />Products
        </button>
        <button 
          className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          <AppIcon name="package" className="icon-inline" />Stock Movements
        </button>
      </div>
      
      <div className="import-content">
        {/* Instructions */}
        <div className="import-instructions">
          <h3><AppIcon name="clipboard" className="icon-inline" />How to Import {activeTab === 'sales' ? 'Sales History' : activeTab === 'products' ? 'Products' : 'Stock Movements'}</h3>
          
          {activeTab === 'sales' && (
            <div className="instructions-list">
              <p>Import historical sales data to improve forecasting accuracy.</p>
              <ol>
                <li>Download the CSV template below</li>
                <li>Fill in your sales data with these columns:
                  <ul>
                    <li><strong>date</strong> - Sale date (YYYY-MM-DD format)</li>
                    <li><strong>product_name</strong> - Product name (must match existing products)</li>
                    <li><strong>quantity</strong> - Number of units sold</li>
                    <li><strong>unit_price</strong> - Price per unit</li>
                    <li><strong>total</strong> - Total sale amount</li>
                    <li><strong>customer</strong> - Customer name (optional)</li>
                  </ul>
                </li>
                <li>Save the file as CSV</li>
                <li>Upload it using the form below</li>
              </ol>
            </div>
          )}
          
          {activeTab === 'products' && (
            <div className="instructions-list">
              <p>Bulk import products to quickly set up your catalog.</p>
              <ol>
                <li>Download the CSV template below</li>
                <li>Fill in your product data with these columns:
                  <ul>
                    <li><strong>name</strong> - Product name</li>
                    <li><strong>category</strong> - Category (free text, e.g., Bowls, Smoothies, etc.)</li>
                    <li><strong>price</strong> - Selling price</li>
                    <li><strong>stock</strong> - Current stock level</li>
                    <li><strong>min_stock</strong> - Minimum stock level for alerts</li>
                  </ul>
                </li>
                <li>Save the file as CSV</li>
                <li>Upload it using the form below</li>
              </ol>
            </div>
          )}
          
          {activeTab === 'stock' && (
            <div className="instructions-list">
              <p>Import stock movements to update inventory levels.</p>
              <ol>
                <li>Download the CSV template below</li>
                <li>Fill in your stock data with these columns:
                  <ul>
                    <li><strong>product_name</strong> - Product name (must match existing products)</li>
                    <li><strong>quantity</strong> - Quantity (positive for receive, negative for adjustment)</li>
                    <li><strong>type</strong> - Movement type (receive, adjustment, count)</li>
                    <li><strong>reason</strong> - Reason for movement</li>
                    <li><strong>notes</strong> - Additional notes (optional)</li>
                  </ul>
                </li>
                <li>Save the file as CSV</li>
                <li>Upload it using the form below</li>
              </ol>
            </div>
          )}
          
          <button 
            className="btn btn-secondary"
            onClick={() => downloadTemplate(activeTab)}
          >
            <AppIcon name="download" className="icon-inline" />Download CSV Template
          </button>
        </div>
        
        {/* Upload Form */}
        <div className="upload-section">
          <h3>Upload CSV File</h3>
          
          <div className="file-upload">
            <input 
              type="file" 
              accept=".csv"
              onChange={handleFileSelect}
              id="csv-upload"
              className="file-input"
            />
            <label htmlFor="csv-upload" className="file-label">
              {file ? (
                <><AppIcon name="file" className="icon-inline" />{file.name}</>
              ) : (
                <><AppIcon name="folder" className="icon-inline" />Choose CSV File</>
              )}
            </label>
          </div>
          
          {preview.length > 0 && (
            <div className="preview-section">
              <h4>Preview (First 5 rows)</h4>
              <div className="preview-table">
                <table>
                  <thead>
                    <tr>
                      {Object.keys(preview[0]).map((header, idx) => (
                        <th key={idx}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, idx) => (
                      <tr key={idx}>
                        {Object.values(row).map((value, vidx) => (
                          <td key={vidx}>{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="import-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setFile(null)
                    setPreview([])
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleImport}
                  disabled={importing}
                >
                  {importing ? 'Importing...' : `Import ${preview.length}+ Records`}
                </button>
              </div>
            </div>
          )}
          
          {importResult && (
            <div className={`import-result ${importResult.success ? 'success' : 'error'}`}>
              {importResult.success ? (
                <>
                  <div className="result-icon"><AppIcon name="check" /></div>
                  <div className="result-content">
                    <h4>Import Successful!</h4>
                    <p>Successfully imported {importResult.imported} records.</p>
                    {importResult.errors > 0 && (
                      <p className="error-note">{importResult.errors} records had errors and were skipped.</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="result-icon"><AppIcon name="close" /></div>
                  <div className="result-content">
                    <h4>Import Failed</h4>
                    <p>{importResult.message}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Tips */}
        <div className="import-tips">
          <h4><AppIcon name="idea" className="icon-inline" />Tips for Successful Import</h4>
          <ul>
            <li>Ensure dates are in YYYY-MM-DD format (e.g., 2026-01-31)</li>
            <li>Product names must match exactly with existing products</li>
            <li>Use decimal points for prices (e.g., 15.50, not 15,50)</li>
            <li>Don't include currency symbols ($, R$, etc.)</li>
            <li>Remove any empty rows at the end of your CSV</li>
            <li>Keep file size under 5MB for best performance</li>
            <li>Test with a small file first (5-10 rows) before importing large datasets</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ImportData
