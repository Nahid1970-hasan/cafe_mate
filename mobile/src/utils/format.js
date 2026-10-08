export function money(value) {
  const amount = Number(value || 0);
  if (Number.isNaN(amount)) return '৳0';
  return `৳${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

export const STATUS_LABEL = {
  NEW: 'Order Placed',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready for pickup',
  COMPLETED: 'Completed',
};

export function customizationText(customizations = []) {
  return customizations
    .map((item) => `${item.groupName || item.option_name}: ${item.optionValue || item.option_value}`)
    .join(', ');
}

export function itemUnit(item) {
  const extras = item.customizations.reduce((sum, option) => sum + Number(option.extraPrice || 0), 0);
  return Number(item.product.price) + extras;
}

export function itemTotal(item) {
  return itemUnit(item) * item.quantity;
}

export function cartTotal(items) {
  return items.reduce((sum, item) => sum + itemTotal(item), 0);
}

export function formatWhen(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
