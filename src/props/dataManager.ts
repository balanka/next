import { Column } from './globalProps';
import { Row } from './tableProps';

interface IRenderState<RowData extends Row> {
  columns: Column<RowData>[];
  currentPage?: number;
  pageSize?: number;
  orderBy?: number;
  orderDirection?: string;
  searchText?: string;
}

export { IRenderState };
