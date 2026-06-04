"use client";

import { useEffect } from "react";
import { trackVisitor, getStoredRestaurantId } from "@/lib/api";

export function VisitorTracker() {
  useEffect(() => {
    const restaurantId = getStoredRestaurantId();
    trackVisitor(restaurantId, undefined);
  }, []);

  return null;
}
