interface DisplayOrderedProduct {
  displayOrder?: number;
  $createdAt?: string;
}

/**
 * Inserts explicitly positioned products into the otherwise natural product
 * order. This lets a new product choose position 1, 2, 3, etc. without
 * rewriting every older product document.
 */
export function orderProductsByDisplayPosition<T extends DisplayOrderedProduct>(
  products: T[]
): T[] {
  const naturallyOrdered = products.filter(
    (product) => !Number.isFinite(product.displayOrder)
  );
  const positioned = products
    .filter((product) => Number.isFinite(product.displayOrder))
    .sort((a, b) => {
      const positionDifference = (a.displayOrder as number) - (b.displayOrder as number);
      if (positionDifference !== 0) return positionDifference;
      return new Date(a.$createdAt || 0).getTime() - new Date(b.$createdAt || 0).getTime();
    });

  const ordered = [...naturallyOrdered];
  positioned.forEach((product) => {
    const index = Math.max(
      0,
      Math.min((product.displayOrder as number) - 1, ordered.length)
    );
    ordered.splice(index, 0, product);
  });

  return ordered;
}
