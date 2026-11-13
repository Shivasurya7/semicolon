const countFormat = new Intl.NumberFormat('en-IN')
const rupeeFormat = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

export function formatCount(value: number): string {
  return countFormat.format(value)
}

export function formatRupees(paise: number): string {
  return rupeeFormat.format(paise / 100)
}

export function formatDuration(days: number): string {
  return `${countFormat.format(days)} ${days === 1 ? 'day' : 'days'}`
}
