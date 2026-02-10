export function computeBoardOrderForInsert(
  sortedOrders: number[],
  index: number,
  emptyOrder = Date.now()
): number {
  if (sortedOrders.length === 0) {
    return emptyOrder;
  }

  if (index <= 0) {
    return sortedOrders[0] - 1024;
  }

  if (index >= sortedOrders.length) {
    return sortedOrders[sortedOrders.length - 1] + 1024;
  }

  const prev = sortedOrders[index - 1];
  const next = sortedOrders[index];
  return (prev + next) / 2;
}
