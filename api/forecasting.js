import { getDb, corsHeaders } from './db.js';

export default async function handler(req, res) {
  const headers = corsHeaders();
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getDb();

  try {
    const { view = 'monthly', categoryId, startDate, endDate } = req.query;

    // Determine date range based on view
    let dateInterval, groupBy, periods;
    
    if (view === 'weekly') {
      dateInterval = '12 weeks'; // Last 12 weeks
      groupBy = 'week';
      periods = 12;
    } else {
      dateInterval = '12 months'; // Last 12 months
      groupBy = 'month';
      periods = 12;
    }

    // Get historical sales data
    const historicalQuery = categoryId
      ? sql`
          SELECT 
            DATE_TRUNC(${groupBy}, s.date) as period,
            c.name as category_name,
            c.id as category_id,
            COUNT(DISTINCT s.id) as transaction_count,
            SUM(si.quantity) as total_quantity,
            SUM(si.subtotal) as total_revenue,
            AVG(si.quantity) as avg_quantity_per_sale
          FROM sales s
          JOIN sale_items si ON s.id = si.sale_id
          JOIN products p ON si.product_id = p.id
          JOIN categories c ON p.category_id = c.id
          WHERE s.date >= NOW() - INTERVAL ${dateInterval}
            AND c.id = ${categoryId}
            AND s.status = 'completed'
          GROUP BY period, c.name, c.id
          ORDER BY period ASC
        `
      : sql`
          SELECT 
            DATE_TRUNC(${groupBy}, s.date) as period,
            COUNT(DISTINCT s.id) as transaction_count,
            SUM(si.quantity) as total_quantity,
            SUM(si.subtotal) as total_revenue,
            AVG(si.quantity) as avg_quantity_per_sale
          FROM sales s
          JOIN sale_items si ON s.id = si.sale_id
          WHERE s.date >= NOW() - INTERVAL ${dateInterval}
            AND s.status = 'completed'
          GROUP BY period
          ORDER BY period ASC
        `;

    const historicalData = await historicalQuery;

    // Get customer growth projections
    const customerProjections = await sql`
      SELECT * FROM customer_growth_projections
      WHERE projection_month >= NOW()
      ORDER BY projection_month ASC
    `;

    // Get product line metrics (avg units per customer)
    const productMetrics = await sql`
      SELECT * FROM product_line_metrics
      ORDER BY category_id, product_id
    `;

    // Get sales by category for breakdown
    const categoryBreakdown = await sql`
      SELECT 
        DATE_TRUNC(${groupBy}, s.date) as period,
        c.name as category_name,
        c.id as category_id,
        SUM(si.quantity) as quantity,
        SUM(si.subtotal) as revenue
      FROM sales s
      JOIN sale_items si ON s.id = si.sale_id
      JOIN products p ON si.product_id = p.id
      JOIN categories c ON p.category_id = c.id
      WHERE s.date >= NOW() - INTERVAL ${dateInterval}
        AND s.status = 'completed'
      GROUP BY period, c.name, c.id
      ORDER BY period ASC, c.name ASC
    `;

    // Calculate forecast using linear regression
    const forecast = calculateForecast(
      historicalData, 
      view === 'weekly' ? 4 : 3,
      view,
      customerProjections,
      productMetrics
    );

    // Get category performance
    const categoryPerformance = await sql`
      SELECT 
        c.id,
        c.name,
        COUNT(DISTINCT s.id) as total_sales,
        SUM(si.quantity) as total_quantity,
        SUM(si.subtotal) as total_revenue,
        AVG(si.quantity) as avg_quantity,
        AVG(si.subtotal) as avg_revenue
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id
      WHERE s.date >= NOW() - INTERVAL ${dateInterval}
        AND s.status = 'completed'
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
    `;

    // Calculate trends for each category
    const categoryTrends = await Promise.all(
      categoryPerformance.map(async (category) => {
        const trend = await calculateCategoryTrend(sql, category.id, groupBy, dateInterval);
        return {
          ...category,
          trend: trend.percentChange,
          trendDirection: trend.direction,
          forecast: trend.forecast,
          confidence: trend.confidence,
        };
      })
    );

    // Get reorder recommendations
    const reorderRecommendations = await getReorderRecommendations(sql, view);

    // Get top products
    const topProducts = await sql`
      SELECT 
        p.id,
        p.name,
        p.stock,
        p.min_stock,
        c.name as category_name,
        SUM(si.quantity) as total_sold,
        SUM(si.subtotal) as total_revenue,
        COUNT(DISTINCT s.id) as sale_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id
      WHERE s.date >= NOW() - INTERVAL ${dateInterval}
        AND s.status = 'completed'
      GROUP BY p.id, p.name, p.stock, p.min_stock, c.name
      ORDER BY total_sold DESC
      LIMIT 10
    `;

    // Calculate key metrics
    const metrics = calculateMetrics(historicalData, forecast);

    return res.status(200).json({
      view,
      period: {
        start: historicalData[0]?.period,
        end: historicalData[historicalData.length - 1]?.period,
      },
      historical: formatHistoricalData(historicalData, categoryBreakdown, view),
      forecast: forecast,
      customerProjections: customerProjections,
      productMetrics: productMetrics,
      categoryPerformance: categoryTrends,
      reorderRecommendations,
      topProducts,
      metrics,
    });

  } catch (error) {
    console.error('Forecasting error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate forecast', 
      details: error.message 
    });
  }
}

// Calculate forecast using linear regression AND customer growth projections
function calculateForecast(historicalData, periods, view, customerProjections, productMetrics) {
  if (!historicalData || historicalData.length < 2) {
    return [];
  }

  const n = historicalData.length;
  const quantities = historicalData.map(d => parseFloat(d.total_quantity) || 0);
  const revenues = historicalData.map(d => parseFloat(d.total_revenue) || 0);

  // Calculate linear regression for baseline trend
  const { slope: qtySlope, intercept: qtyIntercept } = linearRegression(quantities);
  const { slope: revSlope, intercept: revIntercept } = linearRegression(revenues);

  // Calculate average price per unit
  const avgPricePerUnit = revenues.reduce((sum, r, i) => sum + (r / quantities[i] || 0), 0) / n;

  // Generate forecast with customer growth impact
  const forecast = [];
  let cumulativeNewCustomers = 0;

  for (let i = 1; i <= periods; i++) {
    const index = n + i;
    
    // Baseline forecast from trend
    const baselineForecastQty = Math.max(0, qtySlope * index + qtyIntercept);
    const baselineForecastRev = Math.max(0, revSlope * index + revIntercept);

    // Get customer growth for this period
    const periodDate = new Date();
    if (view === 'weekly') {
      periodDate.setDate(periodDate.getDate() + (i * 7));
    } else {
      periodDate.setMonth(periodDate.getMonth() + i);
    }

    // Find matching customer projection
    const projectionMonth = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
    const customerGrowth = customerProjections?.find(cp => {
      const cpDate = new Date(cp.projection_month);
      return cpDate.getFullYear() === projectionMonth.getFullYear() && 
             cpDate.getMonth() === projectionMonth.getMonth();
    });

    // Calculate additional sales from new customers
    let additionalQty = 0;
    let additionalRev = 0;

    if (customerGrowth && productMetrics) {
      const newCustomers = parseInt(customerGrowth.new_customers_count) || 0;
      cumulativeNewCustomers += newCustomers;

      // Calculate additional units from new customers
      productMetrics.forEach(metric => {
        const avgUnits = view === 'weekly' 
          ? parseFloat(metric.avg_units_per_customer_weekly) || 0
          : parseFloat(metric.avg_units_per_customer_monthly) || 0;
        
        additionalQty += newCustomers * avgUnits;
      });

      // Calculate additional revenue
      additionalRev = additionalQty * avgPricePerUnit;

      // Also add cumulative impact (previous new customers continue buying)
      if (i > 1) {
        const cumulativeQty = (cumulativeNewCustomers - newCustomers) * 
          productMetrics.reduce((sum, m) => sum + (view === 'weekly' 
            ? parseFloat(m.avg_units_per_customer_weekly) || 0
            : parseFloat(m.avg_units_per_customer_monthly) || 0), 0);
        additionalQty += cumulativeQty;
        additionalRev += cumulativeQty * avgPricePerUnit;
      }
    }

    // Combined forecast
    const forecastQty = Math.round(baselineForecastQty + additionalQty);
    const forecastRev = Math.round((baselineForecastRev + additionalRev) * 100) / 100;
    
    forecast.push({
      period: i,
      total_quantity: forecastQty,
      total_revenue: forecastRev,
      baseline_quantity: Math.round(baselineForecastQty),
      baseline_revenue: Math.round(baselineForecastRev * 100) / 100,
      customer_growth_quantity: Math.round(additionalQty),
      customer_growth_revenue: Math.round(additionalRev * 100) / 100,
      new_customers_this_period: customerGrowth?.new_customers_count || 0,
      cumulative_new_customers: cumulativeNewCustomers,
      confidence: calculateConfidence(quantities, i),
      isForecast: true,
    });
  }

  return forecast;
}

// Linear regression helper
function linearRegression(values) {
  const n = values.length;
  const indices = values.map((_, i) => i);
  
  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

// Calculate confidence level
function calculateConfidence(values, periodsAhead) {
  const variance = calculateVariance(values);
  const cv = Math.sqrt(variance) / (values.reduce((a, b) => a + b, 0) / values.length);
  
  // Confidence decreases with periods ahead and coefficient of variation
  const baseConfidence = 0.95;
  const confidence = baseConfidence * Math.exp(-0.1 * periodsAhead) * (1 - Math.min(cv, 0.5));
  
  if (confidence > 0.8) return 'High';
  if (confidence > 0.6) return 'Medium';
  return 'Low';
}

// Calculate variance
function calculateVariance(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

// Calculate category trend
async function calculateCategoryTrend(sql, categoryId, groupBy, dateInterval) {
  const data = await sql`
    SELECT 
      DATE_TRUNC(${groupBy}, s.date) as period,
      SUM(si.quantity) as quantity
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    JOIN products p ON si.product_id = p.id
    WHERE p.category_id = ${categoryId}
      AND s.date >= NOW() - INTERVAL ${dateInterval}
      AND s.status = 'completed'
    GROUP BY period
    ORDER BY period ASC
  `;

  if (data.length < 2) {
    return { percentChange: 0, direction: 'stable', forecast: 0, confidence: 'Low' };
  }

  const quantities = data.map(d => parseFloat(d.quantity) || 0);
  const { slope } = linearRegression(quantities);
  
  const firstHalf = quantities.slice(0, Math.floor(quantities.length / 2));
  const secondHalf = quantities.slice(Math.floor(quantities.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const percentChange = ((secondAvg - firstAvg) / firstAvg) * 100;
  const direction = slope > 0.5 ? 'up' : slope < -0.5 ? 'down' : 'stable';
  
  const forecast = Math.round(slope * (quantities.length + 1) + quantities[0]);
  const confidence = calculateConfidence(quantities, 1);
  
  return { percentChange: percentChange.toFixed(1), direction, forecast, confidence };
}

// Get reorder recommendations
async function getReorderRecommendations(sql, view) {
  const daysToCheck = view === 'weekly' ? 7 : 30;
  
  const products = await sql`
    SELECT 
      p.id,
      p.name,
      p.stock,
      p.min_stock,
      c.name as category_name,
      COALESCE(AVG(daily_sales.qty), 0) as avg_daily_sales
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN LATERAL (
      SELECT SUM(si.quantity) / ${daysToCheck}::float as qty
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE si.product_id = p.id
        AND s.date >= NOW() - INTERVAL '${daysToCheck} days'
        AND s.status = 'completed'
    ) daily_sales ON true
    WHERE p.stock > 0
    ORDER BY p.stock / NULLIF(daily_sales.qty, 0) ASC
    LIMIT 20
  `;

  return products.map(p => {
    const avgDaily = parseFloat(p.avg_daily_sales) || 0;
    const daysLeft = avgDaily > 0 ? Math.floor(p.stock / avgDaily) : 999;
    const reorderQty = Math.max(p.min_stock * 2, Math.ceil(avgDaily * daysToCheck));
    
    let priority = 'Low';
    if (daysLeft <= 2) priority = 'Urgent';
    else if (daysLeft <= 5) priority = 'High';
    else if (daysLeft <= 10) priority = 'Medium';
    
    return {
      ...p,
      avg_daily_sales: avgDaily.toFixed(1),
      days_left: daysLeft,
      reorder_qty: reorderQty,
      priority,
    };
  });
}

// Format historical data with category breakdown
function formatHistoricalData(historical, categoryBreakdown, view) {
  const formatted = [];
  
  historical.forEach(h => {
    const periodData = {
      period: h.period,
      label: formatPeriodLabel(h.period, view),
      total_quantity: parseInt(h.total_quantity) || 0,
      total_revenue: parseFloat(h.total_revenue) || 0,
      transaction_count: parseInt(h.transaction_count) || 0,
      categories: {},
    };
    
    // Add category breakdown
    const periodCategories = categoryBreakdown.filter(
      c => new Date(c.period).getTime() === new Date(h.period).getTime()
    );
    
    periodCategories.forEach(c => {
      periodData.categories[c.category_name.toLowerCase()] = {
        quantity: parseInt(c.quantity) || 0,
        revenue: parseFloat(c.revenue) || 0,
      };
    });
    
    formatted.push(periodData);
  });
  
  return formatted;
}

// Format period label
function formatPeriodLabel(period, view) {
  const date = new Date(period);
  
  if (view === 'weekly') {
    const weekNum = getWeekNumber(date);
    return `W${weekNum}`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
}

// Get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Calculate key metrics
function calculateMetrics(historical, forecast) {
  if (!historical || historical.length === 0) {
    return {};
  }

  const totalRevenue = historical.reduce((sum, h) => sum + (parseFloat(h.total_revenue) || 0), 0);
  const totalQuantity = historical.reduce((sum, h) => sum + (parseInt(h.total_quantity) || 0), 0);
  const avgRevenue = totalRevenue / historical.length;
  
  const recentPeriods = historical.slice(-3);
  const recentRevenue = recentPeriods.reduce((sum, h) => sum + (parseFloat(h.total_revenue) || 0), 0) / recentPeriods.length;
  
  const growthRate = ((recentRevenue - avgRevenue) / avgRevenue) * 100;
  
  const forecastRevenue = forecast.reduce((sum, f) => sum + (parseFloat(f.total_revenue) || 0), 0);
  
  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalQuantity,
    avgRevenue: Math.round(avgRevenue * 100) / 100,
    growthRate: Math.round(growthRate * 10) / 10,
    forecastRevenue: Math.round(forecastRevenue * 100) / 100,
    forecastGrowth: Math.round(((forecastRevenue / recentRevenue) - 1) * 100 * 10) / 10,
  };
}
