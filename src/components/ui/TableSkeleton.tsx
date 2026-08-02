import React from 'react'

interface TableSkeletonProps {
  /** Jumlah baris skeleton yang ditampilkan */
  rows?: number
  /** Jumlah kolom skeleton */
  cols?: number
  /** Tampilkan kolom avatar di kolom ke-2 */
  hasAvatar?: boolean
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-slate-200 dark:bg-slate-700/60 ${className || ''}`}
    />
  )
}

export function TableSkeleton({ rows = 8, cols = 6, hasAvatar = false }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="overflow-x-auto thin-scroll">
        <table className="w-full border-collapse text-left text-sm">
          {/* Header */}
          <thead className="border-b border-zinc-100 dark:border-zinc-800/60">
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-6 py-4">
                  <SkeletonPulse className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>

          {/* Rows */}
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-zinc-50 dark:border-zinc-800/30 even:bg-slate-50 dark:even:bg-slate-900/40"
              >
                {Array.from({ length: cols }).map((_, colIdx) => (
                  <td key={colIdx} className="px-6 py-4">
                    {/* Kolom ke-1 (no urut) → kotak kecil */}
                    {colIdx === 0 ? (
                      <SkeletonPulse className="h-3 w-6 mx-auto" />
                    ) : /* Kolom ke-2 dengan avatar */
                    colIdx === 1 && hasAvatar ? (
                      <div className="flex items-center gap-2">
                        <SkeletonPulse className="h-7 w-7 rounded-full shrink-0" />
                        <SkeletonPulse className="h-3 w-24" />
                      </div>
                    ) : /* Kolom terakhir → tombol aksi kecil */
                    colIdx === cols - 1 ? (
                      <div className="flex justify-center gap-1.5">
                        <SkeletonPulse className="h-7 w-7 rounded" />
                        <SkeletonPulse className="h-7 w-7 rounded" />
                      </div>
                    ) : (
                      /* Kolom biasa → bar teks dengan lebar bervariasi */
                      <SkeletonPulse
                        className={`h-3 ${
                          colIdx % 3 === 0 ? 'w-28' : colIdx % 3 === 1 ? 'w-20' : 'w-16'
                        }`}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
