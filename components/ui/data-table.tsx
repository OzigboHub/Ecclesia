'use client'

import * as React from 'react'
import {
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    ArrowUpDown,
    Search
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Column<T> {
    header: string
    accessorKey: keyof T | string
    cell?: (item: T) => React.ReactNode
    sortable?: boolean
}

interface DataTableProps<T> {
    columns: Column<T>[]
    data: T[]
    isLoading?: boolean
    pageSize?: number
    onRowClick?: (item: T) => void
    actions?: (item: T) => React.ReactNode
}

export function DataTable<T>({
    columns,
    data,
    isLoading,
    pageSize = 10,
    onRowClick,
    actions
}: DataTableProps<T>) {
    const [currentPage, setCurrentPage] = React.useState(1)
    const [searchTerm, setSearchTerm] = React.useState('')

    // Filter data based on search term
    const filteredData = React.useMemo(() => {
        if (!searchTerm) return data
        return data.filter((item: any) =>
            Object.values(item).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
    }, [data, searchTerm])

    // Pagination logic
    const totalPages = Math.ceil(filteredData.length / pageSize)
    const paginatedData = filteredData.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    )

    return (
        <div className="space-y-4">
            {/* Table Search & Controls */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                        <tr>
                            {columns.map((col, i) => (
                                <th key={i} className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        {col.header}
                                        {col.sortable && <ArrowUpDown className="h-3 w-3" />}
                                    </div>
                                </th>
                            ))}
                            {actions && <th className="px-4 py-3 text-right">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center">
                                    <div className="flex justify-center">
                                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                    <p className="mt-2 text-muted-foreground">Loading data...</p>
                                </td>
                            </tr>
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">
                                    No results found.
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, i) => (
                                <tr
                                    key={i}
                                    className={cn(
                                        "hover:bg-accent/50 transition-colors",
                                        onRowClick && "cursor-pointer"
                                    )}
                                    onClick={() => onRowClick?.(item)}
                                >
                                    {columns.map((col, j) => (
                                        <td key={j} className="px-4 py-3">
                                            {col.cell ? col.cell(item) : (item as any)[col.accessorKey]}
                                        </td>
                                    ))}
                                    {actions && (
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            {actions(item)}
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-xs text-muted-foreground">
                        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} entries
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded border border-border disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm px-2">Page {currentPage} of {totalPages}</span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded border border-border disabled:opacity-50"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
