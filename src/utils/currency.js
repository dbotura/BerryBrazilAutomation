// Australian currency formatting utilities

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-AU').format(number)
}

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
