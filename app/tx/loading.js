import { Skeleton } from "@/app/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Transaction Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-12 w-full mb-2" />
        <div className="flex gap-2 mt-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Transaction Overview Card */}
      <Card className="mb-8">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-96" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tabs Skeleton */}
      <div className="mb-6">
        <div className="flex gap-2 border-b">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Data */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-32 w-full" />
          </div>

          {/* Logs */}
          <div className="space-y-3">
            <Skeleton className="h-5 w-24" />
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-4 border rounded">
                <Skeleton className="h-5 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
