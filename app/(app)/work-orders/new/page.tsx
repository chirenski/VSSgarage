import { Suspense } from "react";
import NewWorkOrderClient from "./new-work-order-client";

export default function NewWorkOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 slide-up">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Нова поръчка <span className="text-orange-300">•</span>
            </h1>
            <p className="mt-2 text-gray-300">Зареждане...</p>
          </div>
        </div>
      }
    >
      <NewWorkOrderClient />
    </Suspense>
  );
}
