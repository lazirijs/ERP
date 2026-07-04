import { currency } from "@/constants";

export default {
  currency: (value?: number | string, useCurrencyCode = true) => {
    if (!value) value = 0;
    const num = Number(value);
    if (isNaN(num)) return '';
    return `${num}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (useCurrencyCode ? ` ${currency}` : '');
  },
  number: (value: string): number => {
    if (!value) return 0;
    const num = Number(value.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  },
  date: (value: string) => {
    return new Date(value).toLocaleString('en-CA', {
      day: '2-digit',
      year: 'numeric',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '');
  },
  devextreme: {
    currency: { type: 'currency', precision: 0, currency },
    date: { dataType: 'date', format: 'yyyy-MM-dd' } as const,
    datetime: { dataType: 'datetime', format: 'yyyy-MM-dd HH:mm' } as const
  },
  selectOptions: (options: any[], labelKey: string = 'name', valueKey: string = 'uid', excludeValues: string | string[] = []) => {
    const excludeArray = Array.isArray(excludeValues) ? excludeValues : [excludeValues];
    return options.map(option => ({ label: option[labelKey], value: option[valueKey], disabled: excludeArray.includes(option[valueKey]) }))
  },
  stringifyForUrlQuery: (obj: Record<string, any>) => {
    return Object.entries(obj).map(([i, j]) => [i, typeof j === 'string' ? j : JSON.stringify(j)].join("=")).join("&");
  }
}