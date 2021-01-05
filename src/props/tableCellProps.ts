import * as React from 'react';
import { InternalIcons, InternalColumn } from './globalProps';
import { Row } from './tableProps';

interface TableProps<T extends Row<T>> {
  columnDef: InternalColumn<T>;
  value: unknown;
  rowData: T;
  errorState?: object | boolean;
  icons: InternalIcons;
  cellEditable?: boolean;
  onCellEditStarted: (row: T, column: InternalColumn<T>) => void;
  scrollWidth?: number;
  size?: 'small' | 'medium';
  style?: React.CSSProperties;
  children?: JSX.Element;
}

export { TableProps };
