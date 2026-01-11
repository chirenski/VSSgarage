import { Suspense } from "react";
import WorkOrdersClient from "./work-orders-client";

export default function WorkOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 slide-up">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Поръчки <span className="text-orange-300">•</span>
            </h1>
            <p className="mt-2 text-gray-300">Зареждане...</p>
          </div>
        </div>
      }
    >
      <WorkOrdersClient />
    </Suspense>
  );
}
