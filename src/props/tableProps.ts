import type { Action, Column, MaterialTableProps, Options } from './globalProps';

interface ITableProps<RowData extends object> extends MaterialTableProps<RowData>{
  options: Options<RowData>;
  actions: (Action<RowData> | ((rowData: RowData) => Action<RowData>))[];
}

interface ITableState<RowData extends object> {
  data: RowData[];
  errorState?: object;
  query: IQuery<RowData>;
  showAddRow: boolean;
  bulkEditOpen: boolean;
  width?: number;
}

interface IQuery <RowData extends object> {
    filters: IFilter<RowData>[];
    orderBy?: Column<RowData>;
    orderDirection?: string;
    page:number;
    pageSize?: number;
    search?: string;
    totalCount: number;
}

interface IFilter<RowData extends object> {
  column: Column<RowData>;
  operator: string;
  value: unknown;
}

interface Row {
  groups: Row[];
  data: unknown;
    tableData: {
        id: number;
        checked: boolean;
        editing?: string;
        width?: number | string;
        columnOrder?: number;
        defaultFilter?: string;
        filterValue?: string;
        groupOrder?: number;
        groupSort?: string;
        initialWidth?: number | string;
        additionalWidth?: number;
        childRows?: Record<string, Row>;
        showDetailPanel?: unknown
        disabled?: boolean;
        editCellList?: Row[]
    }
}
export {
    ITableState,
    ITableProps,
    IQuery,
    Row
}
