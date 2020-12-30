import { withStyles } from '@material-ui/core';
import * as React from 'react';
import { MaterialTableProps } from './props/globalProps';
import { Table } from './Table';

export { MaterialTable as MTable };

const styles = () => ({
  paginationRoot: {
    width: '100%',
  },
  paginationToolbar: {
    padding: 0,
    width: '100%',
  },
  paginationCaption: {
    display: 'none',
  },
  paginationSelectRoot: {
    margin: 0,
  },
});

function MaterialTable<T extends object>(props: MaterialTableProps<T>) {
  return <Table {...props} ref={props.tableRef} />;
}

export default withStyles(styles, {
  withTheme: true,
})(MaterialTable);

export * from './components';
