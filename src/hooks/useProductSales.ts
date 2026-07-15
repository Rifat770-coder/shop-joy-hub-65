import { useQuery } from "@tanstack/react-query";
import { databases, DATABASE_ID, COLLECTIONS } from "@/integrations/appwrite/config";
import { Query } from "appwrite";

export interface SalesCountMap {
  [productId: string]: number;
}

/**
 * Fetches every order and aggregates the total quantity sold per product.
 * Cached for 5 minutes so it doesn't hammer the database.
 */
export function useProductSales() {
  return useQuery<SalesCountMap>({
    queryKey: ["productSales"],
    queryFn: async () => {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        [
          Query.notEqual("status", "cancelled"),
          Query.limit(1000),
          Query.orderDesc("$createdAt"),
        ]
      );

      const salesMap: SalesCountMap = {};

      for (const doc of response.documents) {
        const rawItems = (doc as Record<string, unknown>).items;
        if (!rawItems) continue;

        let parsedItems: { productId?: string; product?: { id: string }; quantity?: number }[] = [];

        if (Array.isArray(rawItems)) {
          parsedItems = rawItems as any[];
        } else if (typeof rawItems === "string") {
          try {
            const candidate = JSON.parse(rawItems);
            if (Array.isArray(candidate)) parsedItems = candidate;
          } catch {
            // skip malformed JSON
          }
        }

        for (const item of parsedItems) {
          // Support both { productId, quantity } and { product: { id }, quantity } shapes
          const productId = item.productId || item.product?.id;
          const quantity = item.quantity ?? 1;
          if (productId) {
            salesMap[productId] = (salesMap[productId] || 0) + quantity;
          }
        }
      }

      return salesMap;
    },
    staleTime: 1000 * 60 * 5,  // 5 minutes
    gcTime: 1000 * 60 * 10,    // 10 minutes
  });
}
