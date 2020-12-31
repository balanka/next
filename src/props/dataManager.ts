import { InternalColumn } from './globalProps';
import { Row } from './tableProps';

interface IRenderState<RowData extends Row<RowData>> {
  columns: InternalColumn<RowData>[];
  currentPage?: number;
  pageSize?: number;
  orderBy?: number;
  orderDirection?: string;
  searchText?: string;
  data?: RowData[];
  lastEditingRow?: RowData;
  originalData?: RowData[];
  renderData?: RowData[];
  selectedCount?: number;
  treefiedDataLength?: number;
  treeDataMaxLevel?: number;
  groupedDataLength?: number;
}

export { IRenderState };
