import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../lib/api'
import './Forecasting.css'

const FISCAL_MONTH_ORDER = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]
const WEEK_SPLIT_PATTERN = [4, 5, 4, 4, 5, 4]

function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return '-'
  return Number(value).toLocaleString('en-AU', { maximumFractionDigits: 2 })
}

function monthKeyFromParts(year, month) {
  return `${year}-${String(month).padStart(2, '0')}-01`
}

function monthShort(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString('en-AU', { month: 'short' })
}

function fiscalStartYear(date = new Date()) {
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  return month >= 7 ? year : year - 1
}

function monthStartDate(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Date(year, month - 1, 1)
}

function addMonths(monthKey, offset) {
  const date = monthStartDate(monthKey)
  date.setMonth(date.getMonth() + offset)
  return monthKeyFromParts(date.getFullYear(), date.getMonth() + 1)
}

function weekStart(date) {
  const copy = new Date(date)
  const diff = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - diff)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function isoDate(date) {
  return date.toISOString().slice(0, 10)
}

function confidence(row) {
  if (!row.tyActual) return 'Low'
  if ((row.customersBuying || 0) >= 5 && (row.saleItemRows || 0) >= 8) return 'High'
  if ((row.customersBuying || 0) >= 2) return 'Medium'
  return 'Low'
}

function expandMonthlyRowsToWeeks(rows, startingSoh) {
  if (!rows.length) return []

  const weeklyRows = []
  let soh = startingSoh

  for (const row of rows) {
    const monthKey = row.tyMonthKey
    const forecastUnits = row.tyForecast
    if (!monthKey || forecastUnits == null) continue

    const start = monthStartDate(monthKey)
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
    const monthWeeks = []
    let cursor = weekStart(start)

    while (cursor <= end) {
      const weekEnd = new Date(cursor)
      weekEnd.setDate(weekEnd.getDate() + 6)
      const activeStart = cursor < start ? start : cursor
      const activeEnd = weekEnd > end ? end : weekEnd
      const activeDays = Math.round((activeEnd - activeStart) / 86400000) + 1
      monthWeeks.push({
        weekStart: isoDate(cursor),
        label: cursor.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' }),
        monthLabel: row.monthLabel,
        activeDays,
      })
      cursor = new Date(cursor)
      cursor.setDate(cursor.getDate() + 7)
    }

    const totalDays = monthWeeks.reduce((sum, week) => sum + week.activeDays, 0)
    let allocated = 0

    for (let index = 0; index < monthWeeks.length; index += 1) {
      const week = monthWeeks[index]
      const rawUnits = totalDays ? (forecastUnits * week.activeDays) / totalDays : 0
      const weeklyForecast =
        index === monthWeeks.length - 1 ? forecastUnits - allocated : Math.round(rawUnits)
      allocated += weeklyForecast
      const weeklyIntake = index === 0 ? row.intakeUnits : 0
      soh = soh == null ? null : soh + weeklyIntake - weeklyForecast

      weeklyRows.push({
        ...week,
        weeklyForecast,
        intakeUnits: weeklyIntake,
        shrinkageUnits: 0,
        projectedSoh: soh,
      })
    }
  }

  return weeklyRows
}

function expandRollingRowsToPatternWeeks(rows, startingSoh, weeklyLyActualMap) {
  if (!rows.length) return []

  const weeklyRows = []
  let soh = startingSoh

  for (let monthIndex = 0; monthIndex < rows.length; monthIndex += 1) {
    const row = rows[monthIndex]
    const weeksInMonth = WEEK_SPLIT_PATTERN[monthIndex % WEEK_SPLIT_PATTERN.length]
    const monthDemand = row.tyForecast ?? row.tyActual ?? 0
    const openingOverride = row.openingStockDraft === '' ? null : Number(row.openingStockDraft)

    if (openingOverride != null && !Number.isNaN(openingOverride)) {
      soh = openingOverride
    }

    const perWeekDemand = weeksInMonth > 0 ? monthDemand / weeksInMonth : 0
    for (let weekNumber = 1; weekNumber <= weeksInMonth; weekNumber += 1) {
      const intakeUnits = weekNumber === 1 ? row.intakeUnits : 0
      soh = soh == null ? null : soh + intakeUnits - perWeekDemand
      const lyMonthKey = addMonths(row.tyMonthKey, -12)
      const weeklyLyActual = weeklyLyActualMap.get(`${lyMonthKey}|${weekNumber}`) ?? null

      weeklyRows.push({
        key: `${row.tyMonthKey}-w${weekNumber}`,
        monthLabel: row.monthLabel,
        weekInMonth: weekNumber,
        label: `${row.monthLabel} W${weekNumber}`,
        weeklyForecast: perWeekDemand,
        weeklyLyActual,
        intakeUnits,
        projectedSoh: soh,
      })
    }
  }

  return weeklyRows
}

export default function Forecasting() {
  const [payload, setPayload] = useState({
    products: [],
    monthlyActuals: [],
    monthlyForecasts: [],
    weeklyOverrides: [],
    weeklyActuals: [],
    openingStockOverrides: [],
  })
  const [selectedProductId, setSelectedProductId] = useState('')
  const [activeView, setActiveView] = useState('monthly')
  const [rollingStartMonthKey, setRollingStartMonthKey] = useState('')
  const [forecastDrafts, setForecastDrafts] = useState({})
  const [intakeDrafts, setIntakeDrafts] = useState({})
  const [openingStockDrafts, setOpeningStockDrafts] = useState({})
  const [savingMonthKey, setSavingMonthKey] = useState('')
  const [committingTarget, setCommittingTarget] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const response = await api.getLineFlow()
        if (cancelled) return
        setPayload(response)
        const defaultProduct =
          response.products.find((product) => product.name === 'Acai 10kg') || response.products[0]
        setSelectedProductId(defaultProduct ? String(defaultProduct.id) : '')
        setError('')
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load line flow data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedProduct = useMemo(
    () => payload.products.find((product) => String(product.id) === String(selectedProductId)) || null,
    [payload.products, selectedProductId]
  )

  const startYear = fiscalStartYear(new Date())
  const currentFyLabel = `${startYear}/${String(startYear + 1).slice(2)}`
  const previousFyLabel = `${startYear - 1}/${String(startYear).slice(2)}`
  const currentMonthKey = monthKeyFromParts(new Date().getFullYear(), new Date().getMonth() + 1)

  const productActualMap = useMemo(() => {
    if (!selectedProduct) return new Map()
    return new Map(
      payload.monthlyActuals
        .filter((row) => String(row.product_id) === String(selectedProduct.id))
        .map((row) => [
          row.month_key,
          {
            actualUnits: Number(row.actual_units),
            customersBuying: Number(row.customers_buying),
            unitsPerCustomer: row.units_per_customer == null ? null : Number(row.units_per_customer),
            saleItemRows: Number(row.sale_item_rows),
          },
        ])
    )
  }, [payload.monthlyActuals, selectedProduct])

  const productForecastMap = useMemo(() => {
    if (!selectedProduct) return new Map()
    return new Map(
      payload.monthlyForecasts
        .filter((row) => String(row.product_id) === String(selectedProduct.id))
        .map((row) => [
          row.month_key,
          {
            forecastUnits: Number(row.forecast_units),
            targetUnits: row.target_units == null ? null : Number(row.target_units),
            targetCommittedAt: row.target_committed_at || null,
          },
        ])
    )
  }, [payload.monthlyForecasts, selectedProduct])

  const productIntakeMap = useMemo(() => {
    if (!selectedProduct) return new Map()
    return new Map(
      payload.weeklyOverrides
        .filter((row) => String(row.product_id) === String(selectedProduct.id))
        .map((row) => [row.month_key, Number(row.intake_override_units || 0)])
    )
  }, [payload.weeklyOverrides, selectedProduct])

  const productOpeningStockMap = useMemo(() => {
    if (!selectedProduct) return new Map()
    return new Map(
      payload.openingStockOverrides
        .filter((row) => String(row.product_id) === String(selectedProduct.id))
        .map((row) => [row.month_key, Number(row.opening_stock_units)])
    )
  }, [payload.openingStockOverrides, selectedProduct])

  const weeklyLyActualMap = useMemo(() => {
    if (!selectedProduct) return new Map()
    return new Map(
      payload.weeklyActuals
        .filter((row) => String(row.product_id) === String(selectedProduct.id))
        .map((row) => [`${row.month_key}|${Number(row.week_index)}`, Number(row.units)])
    )
  }, [payload.weeklyActuals, selectedProduct])

  const fiscalRows = useMemo(() => {
    if (!selectedProduct) return []

    let rollingSoh = Number(selectedProduct.stock ?? 0)
    let started = false

    return FISCAL_MONTH_ORDER.map((month) => {
      const tyYear = month >= 7 ? startYear : startYear + 1
      const lyYear = tyYear - 1
      const tyMonthKey = monthKeyFromParts(tyYear, month)
      const lyMonthKey = monthKeyFromParts(lyYear, month)
      const tyActual = productActualMap.get(tyMonthKey)
      const lyActual = productActualMap.get(lyMonthKey)
      const forecastState = productForecastMap.get(tyMonthKey)
      const forecastValue =
        forecastDrafts[tyMonthKey] ?? (forecastState?.forecastUnits != null ? String(forecastState.forecastUnits) : '')
      const intakeValue =
        intakeDrafts[tyMonthKey] ?? (productIntakeMap.has(tyMonthKey) ? String(productIntakeMap.get(tyMonthKey)) : '')
      const tyForecast = forecastValue === '' ? null : Number(forecastValue)
      const intakeUnits = intakeValue === '' ? 0 : Number(intakeValue)

      const isCurrentOrFuture = tyMonthKey >= currentMonthKey
      let projectedSoh = null
      if (started || isCurrentOrFuture) {
        started = true
        const demand = tyForecast ?? tyActual?.actualUnits ?? 0
        rollingSoh = rollingSoh + intakeUnits - demand
        projectedSoh = rollingSoh
      }

      const variancePct =
        tyForecast != null && lyActual?.actualUnits != null && lyActual.actualUnits !== 0
          ? ((tyForecast / lyActual.actualUnits) - 1) * 100
          : null

      return {
        monthLabel: monthShort(tyYear, month),
        month,
        tyMonthKey,
        lyActual: lyActual?.actualUnits ?? null,
        tyActual: tyActual?.actualUnits ?? null,
        tyForecast,
        targetUnits: forecastState?.targetUnits ?? null,
        targetCommittedAt: forecastState?.targetCommittedAt ?? null,
        intakeUnits,
        forecastDraft: forecastValue,
        intakeDraft: intakeValue,
        customersBuying: tyActual?.customersBuying ?? null,
        unitsPerCustomer: tyActual?.unitsPerCustomer ?? null,
        saleItemRows: tyActual?.saleItemRows ?? null,
        variancePct,
        projectedSoh,
      }
    })
  }, [currentMonthKey, intakeDrafts, productActualMap, productForecastMap, productIntakeMap, selectedProduct, startYear, forecastDrafts])

  useEffect(() => {
    if (!selectedProduct) return
    const nextForecastDrafts = {}
    const nextIntakeDrafts = {}
    for (const row of fiscalRows) {
      nextForecastDrafts[row.tyMonthKey] = row.forecastDraft
      nextIntakeDrafts[row.tyMonthKey] = row.intakeDraft
    }
    setForecastDrafts(nextForecastDrafts)
    setIntakeDrafts(nextIntakeDrafts)
  }, [selectedProductId])

  useEffect(() => {
    if (!selectedProduct) return
    const nextOpeningDrafts = {}
    for (const [monthKey, openingStockUnits] of productOpeningStockMap.entries()) {
      nextOpeningDrafts[monthKey] = openingStockUnits == null ? '' : String(openingStockUnits)
    }
    setOpeningStockDrafts(nextOpeningDrafts)
  }, [selectedProductId, productOpeningStockMap, selectedProduct])

  const latestActual = useMemo(() => {
    const withActual = fiscalRows.filter((row) => row.tyActual != null)
    return withActual.length ? withActual[withActual.length - 1] : null
  }, [fiscalRows])

  useEffect(() => {
    if (!fiscalRows.length) return
    if (rollingStartMonthKey && fiscalRows.some((row) => row.tyMonthKey === rollingStartMonthKey)) return
    const currentIndex = fiscalRows.findIndex((row) => row.tyMonthKey === currentMonthKey)
    const defaultIndex =
      currentIndex >= 0
        ? (currentIndex - 2 + fiscalRows.length) % fiscalRows.length
        : 0
    setRollingStartMonthKey(fiscalRows[defaultIndex].tyMonthKey)
  }, [currentMonthKey, fiscalRows, rollingStartMonthKey])

  const rollingRows = useMemo(() => {
    if (!selectedProduct || !rollingStartMonthKey) return []

    const rowMonthKeys = Array.from({ length: 12 }, (_, index) => addMonths(rollingStartMonthKey, index))
    let rollingSoh = Number(selectedProduct.stock ?? 0)

    return rowMonthKeys.map((monthKey) => {
      const monthDate = monthStartDate(monthKey)
      const monthNum = monthDate.getMonth() + 1
      const monthYear = monthDate.getFullYear()
      const lyMonthKey = addMonths(monthKey, -12)
      const tyActual = productActualMap.get(monthKey)
      const lyActual = productActualMap.get(lyMonthKey)
      const forecastState = productForecastMap.get(monthKey)
      const forecastValue =
        forecastDrafts[monthKey] ?? (forecastState?.forecastUnits != null ? String(forecastState.forecastUnits) : '')
      const intakeValue =
        intakeDrafts[monthKey] ?? (productIntakeMap.has(monthKey) ? String(productIntakeMap.get(monthKey)) : '')
      const openingStockValue =
        openingStockDrafts[monthKey] ??
        (productOpeningStockMap.has(monthKey) ? String(productOpeningStockMap.get(monthKey)) : '')
      const tyForecast = forecastValue === '' ? null : Number(forecastValue)
      const intakeUnits = intakeValue === '' ? 0 : Number(intakeValue)
      const openingOverride = openingStockValue === '' ? null : Number(openingStockValue)

      if (openingOverride != null && !Number.isNaN(openingOverride)) {
        rollingSoh = openingOverride
      }

      const demand = tyForecast ?? tyActual?.actualUnits ?? 0
      rollingSoh = rollingSoh + intakeUnits - demand
      const projectedSoh = rollingSoh
      const monthsCover = demand > 0 ? projectedSoh / demand : null

      const variancePct =
        tyForecast != null && lyActual?.actualUnits != null && lyActual.actualUnits !== 0
          ? ((tyForecast / lyActual.actualUnits) - 1) * 100
          : null

      return {
        monthLabel: monthShort(monthYear, monthNum),
        month: monthNum,
        tyMonthKey: monthKey,
        lyActual: lyActual?.actualUnits ?? null,
        tyActual: tyActual?.actualUnits ?? null,
        tyForecast,
        targetUnits: forecastState?.targetUnits ?? null,
        targetCommittedAt: forecastState?.targetCommittedAt ?? null,
        intakeUnits,
        openingStockDraft: openingStockValue,
        forecastDraft: forecastValue,
        intakeDraft: intakeValue,
        customersBuying: tyActual?.customersBuying ?? null,
        unitsPerCustomer: tyActual?.unitsPerCustomer ?? null,
        saleItemRows: tyActual?.saleItemRows ?? null,
        variancePct,
        projectedSoh,
        monthsCover,
      }
    })
  }, [selectedProduct, rollingStartMonthKey, productActualMap, productForecastMap, forecastDrafts, intakeDrafts, openingStockDrafts, productIntakeMap, currentMonthKey, productOpeningStockMap])

  const rollingYearLabels = useMemo(() => {
    if (!rollingStartMonthKey) return { current: currentFyLabel, previous: previousFyLabel }
    const startDate = monthStartDate(rollingStartMonthKey)
    const currentStart = startDate.getFullYear()
    const previousStart = currentStart - 1
    return {
      current: `${currentStart}/${String(currentStart + 1).slice(2)}`,
      previous: `${previousStart}/${String(previousStart + 1).slice(2)}`,
    }
  }, [rollingStartMonthKey, currentFyLabel, previousFyLabel])

  const chartRows = rollingRows.map((row) => ({
    month: row.monthLabel,
    lyActual: row.lyActual,
    tyActual: row.tyActual,
    tyForecast: row.tyForecast,
    targetUnits: row.targetUnits,
  }))

  const weeklyPreviewRows = useMemo(
    () => expandRollingRowsToPatternWeeks(rollingRows, Number(selectedProduct?.stock ?? 0), weeklyLyActualMap),
    [rollingRows, selectedProduct, weeklyLyActualMap]
  )

  async function saveMonth(row) {
    if (!selectedProduct) return
    if (row.forecastDraft === '' || Number.isNaN(Number(row.forecastDraft))) {
      setError('Forecast must be a valid number before saving')
      return
    }

    try {
      setSavingMonthKey(row.tyMonthKey)
      setError('')
      const saved = await api.updateLineFlowForecast({
        productId: selectedProduct.id,
        forecastMonth: row.tyMonthKey,
        forecastUnits: Number(row.forecastDraft),
        intakeUnits: row.intakeDraft === '' ? 0 : Number(row.intakeDraft),
        openingStockUnits: row.openingStockDraft === '' ? null : Number(row.openingStockDraft),
        distributionMethod: 'ly_mix',
      })

      setPayload((current) => {
        const nextForecasts = saved.forecast
          ? [
              ...current.monthlyForecasts.filter(
                (item) =>
                  !(String(item.product_id) === String(saved.forecast.product_id) && item.month_key === saved.forecast.month_key)
              ),
              saved.forecast,
            ]
          : current.monthlyForecasts

        const nextOverrides = saved.weeklyOverride
          ? [
              ...current.weeklyOverrides.filter(
                (item) =>
                  !(String(item.product_id) === String(saved.weeklyOverride.product_id) && item.week_start_date === saved.weeklyOverride.week_start_date)
              ),
              saved.weeklyOverride,
            ]
          : current.weeklyOverrides

        const nextOpeningOverrides = saved.openingStockOverride
          ? [
              ...current.openingStockOverrides.filter(
                (item) =>
                  !(String(item.product_id) === String(saved.openingStockOverride.product_id) && item.month_key === saved.openingStockOverride.month_key)
              ),
              saved.openingStockOverride,
            ]
          : row.openingStockDraft === ''
            ? current.openingStockOverrides.filter(
                (item) =>
                  !(String(item.product_id) === String(selectedProduct.id) && item.month_key === row.tyMonthKey)
              )
            : current.openingStockOverrides

        return {
          ...current,
          monthlyForecasts: nextForecasts,
          weeklyOverrides: nextOverrides,
          openingStockOverrides: nextOpeningOverrides,
        }
      })
    } catch (err) {
      setError(err.message || 'Failed to save forecast')
    } finally {
      setSavingMonthKey('')
    }
  }

  async function saveMonthByKey(monthKey) {
    const row = rollingRows.find((item) => item.tyMonthKey === monthKey)
    if (!row) return
    await saveMonth(row)
  }

  async function saveOpeningStockByKey(monthKey) {
    if (!selectedProduct) return
    const row = rollingRows.find((item) => item.tyMonthKey === monthKey)
    if (!row) return

    const openingStockValue = row.openingStockDraft
    if (openingStockValue !== '' && Number.isNaN(Number(openingStockValue))) {
      setError('Opening stock must be a valid number')
      return
    }

    try {
      setSavingMonthKey(monthKey)
      setError('')
      const saved = await api.updateLineFlowForecast({
        productId: selectedProduct.id,
        forecastMonth: monthKey,
        openingStockUnits: openingStockValue === '' ? null : Number(openingStockValue),
      })

      setPayload((current) => {
        const nextOpeningOverrides = saved.openingStockOverride
          ? [
              ...current.openingStockOverrides.filter(
                (item) =>
                  !(String(item.product_id) === String(saved.openingStockOverride.product_id) && item.month_key === saved.openingStockOverride.month_key)
              ),
              saved.openingStockOverride,
            ]
          : current.openingStockOverrides.filter(
              (item) =>
                !(String(item.product_id) === String(selectedProduct.id) && item.month_key === monthKey)
            )

        return {
          ...current,
          openingStockOverrides: nextOpeningOverrides,
        }
      })
    } catch (err) {
      setError(err.message || 'Failed to save opening stock override')
    } finally {
      setSavingMonthKey('')
    }
  }

  async function commitToTarget() {
    if (!selectedProduct) return

    try {
      setCommittingTarget(true)
      setError('')
      const targets = rollingRows
        .filter((row) => row.forecastDraft !== '' && !Number.isNaN(Number(row.forecastDraft)))
        .map((row) => ({
          forecastMonth: row.tyMonthKey,
          targetUnits: Number(row.forecastDraft),
          distributionMethod: 'ly_mix',
        }))

      const result = await api.commitLineFlowTarget({
        action: 'commit-target',
        productId: selectedProduct.id,
        targets,
      })

      setPayload((current) => {
        const committedMap = new Map(
          (result.committed || []).map((row) => [row.month_key, row])
        )
        const untouched = current.monthlyForecasts.filter(
          (row) =>
            !(String(row.product_id) === String(selectedProduct.id) && committedMap.has(row.month_key))
        )
        return {
          ...current,
          monthlyForecasts: [...untouched, ...(result.committed || [])],
        }
      })
    } catch (err) {
      setError(err.message || 'Failed to commit target')
    } finally {
      setCommittingTarget(false)
    }
  }

  if (loading) {
    return (
      <div className="forecasting">
        <h2 className="page-title">Sales Forecast Tool</h2>
        <div className="card">Loading line flow data...</div>
      </div>
    )
  }

  if (!selectedProduct) {
    return (
      <div className="forecasting">
        <h2 className="page-title">Sales Forecast Tool</h2>
        <div className="card line-flow-error">{error || 'No product selected.'}</div>
      </div>
    )
  }

  return (
    <div className="forecasting">
      <h2 className="page-title">Sales Forecast Tool</h2>

      <div className="forecast-controls">
        <div className="control-group product-select-control">
          <label>SKU</label>
          <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)}>
            {payload.products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="view-toggle">
        <button type="button" className={`toggle-btn ${activeView === 'monthly' ? 'active' : ''}`} onClick={() => setActiveView('monthly')}>
          Monthly
        </button>
        <button type="button" className={`toggle-btn ${activeView === 'weekly' ? 'active' : ''}`} onClick={() => setActiveView('weekly')}>
          Weekly Preview
        </button>
      </div>

      {error ? <div className="card line-flow-error">{error}</div> : null}

      <div className="line-flow-summary-grid">
        <div className="card line-flow-summary-card">
          <span className="summary-label">Lead Time</span>
          <strong>8</strong>
          <small>weeks</small>
        </div>
        <div className="card line-flow-summary-card">
          <span className="summary-label">Line Window</span>
          <strong>{currentFyLabel}</strong>
          <small>July to June</small>
        </div>
        <div className="card line-flow-summary-card">
          <span className="summary-label">Latest Actual</span>
          <strong>{latestActual ? formatNumber(latestActual.tyActual) : '-'}</strong>
          <small>{latestActual ? latestActual.monthLabel : 'No history'}</small>
        </div>
      </div>

      {activeView === 'monthly' && (
        <>
          <div className="card">
            <h3 className="section-title">Monly Overview</h3>
                <p className="chart-subtitle">
              Fiscal window runs July through June. The chart overlays {previousFyLabel} actual, {currentFyLabel} actual, the working forecast, and the committed target snapshot.
                </p>
            <ResponsiveContainer width="100%" height={360}>
              <ComposedChart data={chartRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="lyActual" name={`${previousFyLabel} Actual`} stroke="#94a3b8" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="tyActual" name={`${currentFyLabel} Actual`} stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="tyForecast" name={`${currentFyLabel} Forecast`} stroke="#1d4ed8" strokeWidth={3} strokeDasharray="6 4" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="targetUnits" name="Target" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 2 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="line-flow-section-head">
              <div>
                <h3 className="section-title">Monthly Planning Grid</h3>
              </div>
              <div className="control-group" style={{ maxWidth: 220 }}>
                <label>Rolling Start Month</label>
                <select
                  value={rollingStartMonthKey}
                  onChange={(event) => setRollingStartMonthKey(event.target.value)}
                >
                  {fiscalRows.map((row) => (
                    <option key={row.tyMonthKey} value={row.tyMonthKey}>
                      {row.monthLabel}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="commit-target-btn"
                onClick={commitToTarget}
                disabled={committingTarget}
              >
                {committingTarget ? 'Committing...' : 'Commit to Target'}
              </button>
            </div>
            <div className="analysis-table">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                      <th>{rollingYearLabels.previous} Actual</th>
                      <th>{rollingYearLabels.current} Actual</th>
                      <th>{rollingYearLabels.current} Forecast</th>
                      <th>Target</th>
                      <th>Intake</th>
                      <th>SOH</th>
                      <th>Months Cover</th>
                      <th>% Var</th>
                      <th>Customers</th>
                      <th>Units / Customer</th>
                      <th>New Opening Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {rollingRows.map((row) => (
                    <tr key={row.tyMonthKey}>
                      <td className="category-name">{row.monthLabel}</td>
                      <td>{formatNumber(row.lyActual)}</td>
                      <td>{formatNumber(row.tyActual)}</td>
                      <td>
                        <div className="forecast-input-wrap">
                          <input
                            className="forecast-input"
                            type="number"
                            min="0"
                            step="1"
                            value={row.forecastDraft}
                            onChange={(event) => {
                              const value = event.target.value
                              setForecastDrafts((current) => ({ ...current, [row.tyMonthKey]: value }))
                            }}
                            onBlur={() => saveMonthByKey(row.tyMonthKey)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                event.currentTarget.blur()
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td className="target-value">{formatNumber(row.targetUnits)}</td>
                      <td>
                        <div className="forecast-input-wrap">
                          <input
                            className="forecast-input"
                            type="number"
                            min="0"
                            step="1"
                            value={row.intakeDraft}
                            onChange={(event) => {
                              const value = event.target.value
                              setIntakeDrafts((current) => ({ ...current, [row.tyMonthKey]: value }))
                            }}
                            onBlur={() => saveMonthByKey(row.tyMonthKey)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                event.currentTarget.blur()
                              }
                            }}
                          />
                        </div>
                      </td>
                      <td className="forecast-value">{formatNumber(row.projectedSoh)}</td>
                      <td className={row.monthsCover != null && row.monthsCover < 2 ? 'months-cover-low' : ''}>
                        {row.monthsCover == null ? '-' : row.monthsCover.toFixed(1)}
                      </td>
                      <td className={row.variancePct > 0 ? 'trend-positive' : row.variancePct < 0 ? 'trend-negative' : ''}>
                        {row.variancePct == null ? '-' : `${row.variancePct.toFixed(1)}%`}
                      </td>
                      <td>{formatNumber(row.customersBuying)}</td>
                      <td>{formatNumber(row.unitsPerCustomer)}</td>
                      <td>
                        <div className="forecast-input-wrap">
                          <input
                            className="forecast-input opening-override-input"
                            type="number"
                            step="1"
                            placeholder="carry"
                            value={row.openingStockDraft}
                            onChange={(event) => {
                              const value = event.target.value
                              setOpeningStockDrafts((current) => ({ ...current, [row.tyMonthKey]: value }))
                            }}
                            onBlur={() => saveOpeningStockByKey(row.tyMonthKey)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                event.currentTarget.blur()
                              }
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeView === 'weekly' && (
        <>
          <div className="card">
            <h3 className="section-title">Weekly Forecast Preview</h3>
            <p className="chart-subtitle">
              Weekly projection using fixed month splits (4-5-4-4-5-4), repeating across the rolling 12-month window.
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={weeklyPreviewRows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="weeklyLyActual" name="LY Weekly Actual" stroke="#94a3b8" strokeWidth={2} dot={{ r: 2 }} />
                <Line type="monotone" dataKey="weeklyForecast" name="Weekly Forecast" stroke="#1d4ed8" strokeWidth={3} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="section-title">Weekly Flow Preview Table</h3>
            <div className="analysis-table">
              <table>
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Month</th>
                    <th>LY Actual</th>
                    <th>Forecast Sales</th>
                    <th>Intake</th>
                    <th>Projected SOH</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyPreviewRows.map((row) => (
                    <tr key={row.key}>
                      <td className="category-name">{row.label}</td>
                      <td>{row.monthLabel}</td>
                      <td>{formatNumber(row.weeklyLyActual)}</td>
                      <td className="forecast-value">{formatNumber(row.weeklyForecast)}</td>
                      <td>{formatNumber(row.intakeUnits)}</td>
                      <td>{formatNumber(row.projectedSoh)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
