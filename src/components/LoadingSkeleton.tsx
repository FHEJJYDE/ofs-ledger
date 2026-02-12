import React from 'react';

export function LoadingSkeleton() {
    return (
        <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="space-y-3">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-5/6"></div>
                <div className="h-4 bg-muted rounded w-4/6"></div>
            </div>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="bg-card border rounded-lg p-6 space-y-4">
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-4/5"></div>
                </div>
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="animate-pulse space-y-3">
            <div className="h-10 bg-muted rounded"></div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/50 rounded"></div>
            ))}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <CardSkeleton />
                <CardSkeleton />
            </div>
            <TableSkeleton />
        </div>
    );
}
