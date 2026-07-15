"use client"
import * as React from "react"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
    SortingState,
getSortedRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
      const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
     onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 8 } },
  })

  const pageIndex = table.getState().pagination.pageIndex
  const pageSize = table.getState().pagination.pageSize
  const totalRows = table.getFilteredRowModel().rows.length
  const firstRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const lastRow = Math.min((pageIndex + 1) * pageSize, totalRows)

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/40 shadow-xl shadow-black/20">
        <Table className="[&_td]:border-r [&_td]:border-white/5 [&_th]:border-r [&_th]:border-white/5 [&_td:last-child]:border-r-0 [&_th:last-child]:border-r-0">
          <TableHeader className="[&_tr]:border-b [&_tr]:border-white/10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-slate-900/80 hover:bg-slate-900/80"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="sticky top-0 z-10 h-auto bg-slate-900/80 py-3 backdrop-blur"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    row.index % 2 === 1 ? "bg-white/[0.025]" : "bg-transparent"
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="max-w-[240px] truncate py-3.5 text-[15px] text-slate-200"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                  Aucun résultat.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2 py-4">
        <span className="text-sm text-slate-500">
          {totalRows > 0 ? (
            <>
              Lignes <span className="text-slate-300">{firstRow}–{lastRow}</span> sur{" "}
              <span className="text-slate-300">{totalRows}</span>
            </>
          ) : (
            "Aucune ligne"
          )}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="border-white/10 bg-transparent text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  )
}