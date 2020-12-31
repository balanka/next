import {
  Action,
  InternalColumn,
  Column,
  MaterialTableProps,
  Options,
} from './globalProps';

interface ITableProps<RowData extends Row<RowData>>
  extends MaterialTableProps<RowData> {
  options: Options<RowData>;
  actions: (Action<RowData> | ((rowData: RowData) => Action<RowData>))[];
  columns: InternalColumn<RowData>[];
}

interface ITableState<RowData extends Row<RowData>> {
  data: RowData[];
  errorState?: object;
  query: IQuery<RowData>;
  showAddRow: boolean;
  bulkEditOpen: boolean;
  width?: number;
  isLoading?: boolean;
}

interface IQuery<RowData extends Row<RowData>> {
  filters: IFilter<RowData>[];
  orderBy?: Column<RowData>;
  orderDirection?: string;
  page: number;
  pageSize?: number;
  search?: string;
  totalCount: number;
}

interface IFilter<RowData extends Row<RowData>> {
  column: Column<RowData>;
  operator: string;
  value: unknown;
}

interface Row<RowData extends Row<RowData>> {
  tableData: {
    id: number;
    isTreeExpanded?: boolean;
    checked?: boolean;
    editing?: string;
    width?: number | string;
    columnOrder?: number;
    defaultFilter?: string;
    filterValue?: string;
    groupOrder?: number;
    groupSort?: string;
    initialWidth?: number | string;
    additionalWidth?: number;
    childRows?: RowData[];
    showDetailPanel?: number;
    disabled?: boolean;
    editCellList?: RowData[];
    markedForTreeRemove?: boolean;
    path?: number[];
  };
  groups?: RowData[];
  isExpanded?: boolean;
  groupsIndex?: Record<string, number>;
  data: RowData[];
  [x: string]: any;
}
export { ITableState, ITableProps, IQuery, Row };
