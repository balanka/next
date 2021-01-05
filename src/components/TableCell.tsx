import * as React from 'react';
import MuiTableCell from '@material-ui/core/TableCell';
import parseISO from 'date-fns/parseISO';
import * as CommonValues from '../utils/common-values';
import { Row } from '../props/tableProps';
import { TableProps } from '../props/tableCellProps';
import { Column } from '../props/globalProps';

const isoDateRegex = /^\d{4}-(0[1-9]|1[0-2])-([12]\d|0[1-9]|3[01])([T\s](([01]\d|2[0-3])\:[0-5]\d|24\:00)(\:[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3])\:?([0-5]\d)?)?)?$/;

function TableCell<T extends Row<T>>(props: TableProps<T>) {
  const {
    icons,
    columnDef,
    rowData,
    value,
    errorState,
    cellEditable,
    onCellEditStarted,
    scrollWidth,
    ...cellProps
  } = props;

  const cellAlignment =
    columnDef.align !== undefined
      ? columnDef.align
      : ['numeric', 'currency'].indexOf(columnDef.type!) !== -1
      ? 'right'
      : 'left';

  let renderValue = getRenderValue(props);
  if (cellEditable) {
    renderValue = (
      <div
        style={{
          borderBottom: '1px dashed grey',
          cursor: 'pointer',
          width: 'max-content',
        }}
        onClick={e => {
          e.stopPropagation();
          onCellEditStarted(rowData, columnDef);
        }}
      >
        {renderValue}
      </div>
    );
  }

  const handleClickCell = (
    e: React.MouseEvent<HTMLTableHeaderCellElement, MouseEvent>
  ) => {
    if (columnDef.disableClick) {
      e.stopPropagation();
    }
  };

  const getStyle = () => {
    const width = CommonValues.reducePercentsInCalc(
      String(columnDef.tableData.width),
      scrollWidth
    );

    let cellStyle: React.CSSProperties = {
      color: 'inherit',
      width,
      maxWidth: columnDef.maxWidth,
      minWidth: columnDef.minWidth,
      boxSizing: 'border-box',
      fontSize: 'inherit',
      fontFamily: 'inherit',
      fontWeight: 'inherit',
    };

    if (typeof columnDef.cellStyle === 'function') {
      cellStyle = {
        ...cellStyle,
        ...columnDef.cellStyle(value, rowData),
      };
    } else {
      cellStyle = { ...cellStyle, ...columnDef.cellStyle };
    }

    if (columnDef.disableClick) {
      cellStyle.cursor = 'default';
    }

    return { ...props.style, ...cellStyle };
  };

  return (
    <MuiTableCell
      size={props.size}
      {...cellProps}
      style={getStyle()}
      align={cellAlignment}
      onClick={handleClickCell}
    >
      {props.children}
      {renderValue}
    </MuiTableCell>
  );
}

function getRenderValue<T extends Row<T>>(props: TableProps<T>) {
  const dateLocale =
    props.columnDef.dateSetting && props.columnDef.dateSetting.locale
      ? props.columnDef.dateSetting.locale
      : undefined;
  if (
    props.columnDef.emptyValue !== undefined &&
    (props.value === undefined || props.value === null)
  ) {
    return getEmptyValue(props.columnDef.emptyValue, props.rowData);
  }
  if (props.columnDef.render) {
    if (props.rowData) {
      return props.columnDef.render(props.rowData, 'row');
    } else if (props.value) {
      return props.columnDef.render(props.value, 'group');
    }
  } else if (props.columnDef.type === 'boolean') {
    const style: React.CSSProperties = {
      textAlign: 'left',
      verticalAlign: 'middle',
      width: 48,
    };
    if (props.value) {
      return <props.icons.Check style={style} />;
    } else {
      return <props.icons.ThirdStateCheck style={style} />;
    }
  } else if (props.columnDef.type === 'date') {
    if (props.value instanceof Date) {
      return props.value.toLocaleDateString(dateLocale);
    } else if (
      typeof props.value === 'string' &&
      isoDateRegex.exec(props.value)
    ) {
      return parseISO(props.value).toLocaleDateString(dateLocale);
    } else {
      return props.value;
    }
  } else if (props.columnDef.type === 'time') {
    if (props.value instanceof Date) {
      return props.value.toLocaleTimeString();
    } else if (
      typeof props.value === 'string' &&
      isoDateRegex.exec(props.value)
    ) {
      return parseISO(props.value).toLocaleTimeString(dateLocale);
    } else {
      return props.value;
    }
  } else if (props.columnDef.type === 'datetime') {
    if (props.value instanceof Date) {
      return props.value.toLocaleString();
    } else if (
      typeof props.value === 'string' &&
      isoDateRegex.exec(props.value)
    ) {
      return parseISO(props.value).toLocaleString(dateLocale);
    } else {
      return props.value;
    }
  } else if (props.columnDef.type === 'currency') {
    return getCurrencyValue(props.columnDef.currencySetting, props.value);
  } else if (typeof props.value === 'boolean') {
    // To avoid forwardref boolean children.
    return props.value.toString();
  }

  return props.value;
}

function getEmptyValue<T extends Row<T>>(emptyValue: unknown, rowData: T) {
  if (typeof emptyValue === 'function') {
    return emptyValue(rowData);
  } else {
    return emptyValue;
  }
}

function getCurrencyValue<T extends Row<T>>(
  currencySetting: Column<T>['currencySetting'],
  value: unknown
) {
  if (currencySetting !== undefined) {
    return new Intl.NumberFormat(
      currencySetting.locale !== undefined ? currencySetting.locale : 'en-US',
      {
        style: 'currency',
        currency:
          currencySetting.currencyCode !== undefined
            ? currencySetting.currencyCode
            : 'USD',
        minimumFractionDigits:
          currencySetting.minimumFractionDigits !== undefined
            ? currencySetting.minimumFractionDigits
            : 2,
        maximumFractionDigits:
          currencySetting.maximumFractionDigits !== undefined
            ? currencySetting.maximumFractionDigits
            : 2,
      }
    ).format(typeof value === 'number' ? value : 0);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(typeof value === 'number' ? value : 0);
  }
}

export { TableCell as MTableCell };
