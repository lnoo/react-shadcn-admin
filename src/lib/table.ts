import {
  type Cell,
  type Column,
  type ColumnDef,
  columnFacetingFeature,
  columnFilteringFeature,
  columnVisibilityFeature,
  type Row,
  type RowData,
  rowPaginationFeature,
  rowSelectionFeature,
  rowSortingFeature,
  globalFilteringFeature,
  createFacetedRowModel,
  createFacetedUniqueValues,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  type Table,
  tableFeatures,
} from '@tanstack/react-table'

/**
 * Explicit v9 feature set used by both Tasks and Users tables.
 * Keep this object module-level so table instances share stable feature identities.
 */
export const tableFeaturesConfig = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  columnFacetingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  facetedRowModel: createFacetedRowModel(),
  facetedUniqueValues: createFacetedUniqueValues(),
})

export type { RowData } from '@tanstack/react-table'

type AppFeatures = typeof tableFeaturesConfig

export type AppTable<TData extends RowData> = Table<AppFeatures, TData>
export type AppRow<TData extends RowData> = Row<AppFeatures, TData>
export type AppColumn<TData extends RowData, TValue = unknown> = Column<AppFeatures, TData, TValue>
export type AppCell<TData extends RowData, TValue = unknown> = Cell<AppFeatures, TData, TValue>
export type AppColumnDef<TData extends RowData, TValue = unknown> = ColumnDef<AppFeatures, TData, TValue>
