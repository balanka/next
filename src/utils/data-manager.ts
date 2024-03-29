import formatDate from 'date-fns/format';
import { DropResult } from 'react-beautiful-dnd';
import { byString } from '.';
import { IRenderState } from '../props/dataManager';
import type { ColumDefType, Column, InternalColumn } from '../props/globalProps';
import type { Row } from '../props/tableProps';

export default class DataManager<T extends Row<T>> {
  applyFilters = false;
  applySearch = false;
  applySort = false;
  currentPage = 0;
  detailPanelType = 'multiple';
  lastDetailPanelRow: T | undefined  = undefined;
  lastEditingRow: T | undefined = undefined;
  orderBy = -1;
  orderDirection = '';
  pageSize = 5;
  paging = true;
  parentFunc: any = null;
  searchText = '';
  selectedCount = 0;
  treefiedDataLength = 0;
  treeDataMaxLevel = 0;
  groupedDataLength = 0;
  defaultExpanded: ((rowData: T) => boolean) | boolean | undefined = false;
  bulkEditOpen = false;
  bulkEditChangedRows: Record<string, { oldData: T; newData: T; }> = {};

  data: T[] = [];
  columns: (InternalColumn<T>)[] = [];

  filteredData: T[] = [];
  searchedData: T[] = [];
  groupedData: T[] = [];
  treefiedData: T[] | T = [];
  sortedData: T[] = [];
  pagedData: T[] = [];
  renderData : T[]= [];

  filtered = false;
  searched = false;
  grouped = false;
  treefied = false;
  sorted = false;
  paged = false;

  rootGroupsIndex = {};

  constructor() {}

  setData(data: T[]) {
    this.selectedCount = 0;

    this.data = data.map((row, index) => {
      row.tableData = { ...row.tableData, id: index };
      if (row.tableData.checked) {
        this.selectedCount++;
      }
      return row;
    });

    this.filtered = false;
  }

  setColumns(columns: InternalColumn<T>[]) {
    const undefinedWidthColumns = columns.filter(c => {
      if (c.hidden) {
        // Hidden column
        return false;
      }
      if (c.columnDef && c.columnDef.tableData && c.columnDef.tableData.width) {
        // tableData.width already calculated
        return false;
      }
      // Calculate width if no value provided
      return c.width === undefined;
    });
    let usedWidth: string[] | string = ['0px'];

    this.columns = columns.map((columnDef, index) => {
      const width =
        typeof columnDef.width === 'number'
          ? columnDef.width + 'px'
          : columnDef.width;

      if (
        width &&
        columnDef.tableData &&
        columnDef.tableData.width !== undefined &&
        Array.isArray(usedWidth)
      ) {
        usedWidth.push(width);
      }

      columnDef.tableData = {
        columnOrder: index,
        filterValue: columnDef.defaultFilter,
        groupOrder: columnDef.defaultGroupOrder,
        groupSort: columnDef.defaultGroupSort || 'asc',
        width,
        initialWidth: width,
        additionalWidth: 0,
        ...columnDef.tableData,
        id: index,
      };

      return columnDef;
    });

    usedWidth = '(' + usedWidth.join(' + ') + ')';
    undefinedWidthColumns.forEach(columnDef => {
      columnDef.tableData.width = columnDef.tableData.initialWidth = `calc((100% - ${usedWidth}) / ${undefinedWidthColumns.length})`;
    });
  }

  setDefaultExpanded(expanded?: boolean | ((rowData: T) => boolean)) {
    this.defaultExpanded = expanded;
  }

  changeApplySearch(applySearch: boolean) {
    this.applySearch = applySearch;
    this.searched = false;
  }

  changeApplyFilters(applyFilters: boolean) {
    this.applyFilters = applyFilters;
    this.filtered = false;
  }

  changeApplySort(applySort: boolean) {
    this.applySort = applySort;
    this.sorted = false;
  }

  changePaging(paging: boolean) {
    this.paging = paging;
    this.paged = false;
  }

  changeCurrentPage(currentPage: number) {
    this.currentPage = currentPage;
    this.paged = false;
  }

  changePageSize(pageSize: number) {
    this.pageSize = pageSize;
    this.paged = false;
  }

  changeParentFunc(parentFunc: unknown) {
    this.parentFunc = parentFunc;
  }

  changeFilterValue(columnId: number, value: string) {
    this.columns[columnId].tableData.filterValue = value;
    this.filtered = false;
  }

  changeRowSelected(checked: boolean, path: number[]) {
    const rowData = this.findDataByPath(this.sortedData, path);
    if(rowData && "tableData" in rowData) {
      rowData.tableData.checked = checked;
    }
    this.selectedCount = this.selectedCount + (checked ? 1 : -1);

    const checkChildRows = (rowData?: T) => {
      if (rowData && rowData.tableData.childRows) {
        rowData.tableData.childRows.forEach(childRow => {
          if (childRow.tableData.checked !== checked) {
            childRow.tableData.checked = checked;
            this.selectedCount = this.selectedCount + (checked ? 1 : -1);
          }
          checkChildRows(childRow as T);
        });
      }
    };

    checkChildRows(rowData);

    this.filtered = false;
  }

  changeDetailPanelVisibility(path: number[], render: number) {
    const rowData = this.findDataByPath(this.sortedData, path);

    if (rowData && 
      (rowData.tableData?.showDetailPanel || '').toString() === render.toString()
    ) {
      rowData.tableData.showDetailPanel = undefined;
    } else if(rowData){
      rowData.tableData.showDetailPanel = render;
    }

    if (
      this.detailPanelType === 'single' &&
      this.lastDetailPanelRow &&
      this.lastDetailPanelRow != rowData
    ) {
      this.lastDetailPanelRow.tableData.showDetailPanel = undefined;
    }

    this.lastDetailPanelRow = rowData;
  }

  changeGroupExpand(path: number[]) {
    const rowData = this.findDataByPath(this.sortedData, path);
    if(rowData) {
      rowData.isExpanded = !rowData.isExpanded;
    }
  }

  changeSearchText(searchText: string) {
    this.searchText = searchText;
    this.searched = false;
    this.currentPage = 0;
  }

  changeRowEditing(rowData?: T, mode?: string) {
    if (rowData) {
      rowData.tableData.editing = mode;

      if (this.lastEditingRow && this.lastEditingRow != rowData) {
        this.lastEditingRow.tableData.editing = undefined;
      }

      if (mode) {
        this.lastEditingRow = rowData;
      } else {
        this.lastEditingRow = undefined;
      }
    } else if (this.lastEditingRow) {
      this.lastEditingRow.tableData.editing = undefined;
      this.lastEditingRow = undefined;
    }
  }

  changeBulkEditOpen(bulkEditOpen: boolean) {
    this.bulkEditOpen = bulkEditOpen;
  }

  changeAllSelected(checked: boolean) {
    let selectedCount = 0;
    if (this.isDataType('group')) {
      const setCheck = (data: T[]) => {
        data.forEach(element => {
          if (element.groups && element.groups.length > 0) {
            setCheck(element.groups as T[]);
          } else {
            (element as {data: T[]}).data.forEach(d => {
              d.tableData.checked = d.tableData.disabled ? false : checked;
              selectedCount++;
            });
          }
        });
      };

      setCheck(this.groupedData);
    } else {
      this.searchedData.map(row => {
        row.tableData.checked = row.tableData.disabled ? false : checked;
        return row;
      });
      selectedCount = this.searchedData.length;
    }

    this.selectedCount = checked ? selectedCount : 0;
  }

  changeOrder(orderBy: number, orderDirection: string) {
    this.orderBy = orderBy;
    this.orderDirection = orderDirection;
    this.currentPage = 0;

    this.sorted = false;
  }

  changeGroupOrder(columnId: number) {
    const column = this.columns.find(c => c.tableData.id === columnId);
    if(!column)return;
    if (column.tableData.groupSort === 'asc') {
      column.tableData.groupSort = 'desc';
    } else {
      column.tableData.groupSort = 'asc';
    }

    this.sorted = false;
  }

  changeColumnHidden(column: Column<T>, hidden: boolean) {
    column.hidden = hidden;
    column.hiddenByColumnsButton = hidden;
  }

  changeTreeExpand(path: number[]) {
    const rowData = this.findDataByPath(this.sortedData, path);
    if(rowData && "tableData" in rowData) {
      rowData.tableData.isTreeExpanded = !(rowData.tableData.isTreeExpanded ?? false);
    }
  }

  changeDetailPanelType(type: string) {
    this.detailPanelType = type;
  }

  changeByDrag(result: DropResult) {
    let start = 0;

    let groups = this.columns
      .filter(col => (col.tableData.groupOrder ?? 0) > -1)
      .sort(
        (col1, col2) => (col1.tableData.groupOrder ?? 0) - (col2.tableData.groupOrder ?? 0)
      );

    if (
      result.destination &&
      result.destination.droppableId === 'groups' &&
      result.source.droppableId === 'groups'
    ) {
      start = Math.min(result.destination.index, result.source.index);
      const end = Math.max(result.destination.index, result.source.index);

      groups = groups.slice(start, end + 1);

      if (result.destination.index < result.source.index) {
        // Take last and add as first
        const last = groups.pop();
        last && groups.unshift(last);
      } else {
        // Take first and add as last
        const last = groups.shift();
        last && groups.push(last);
      }
    } else if (
      result.destination &&
      result.destination.droppableId === 'groups' &&
      result.source.droppableId === 'headers'
    ) {
      const newGroup = this.columns.find(
        c => c.tableData.id === Number(result.draggableId)
      );

      if (!newGroup || newGroup.grouping === false || !newGroup.field) {
        return;
      }

      groups.splice(result.destination.index, 0, newGroup);
    } else if (
      result.destination &&
      result.destination.droppableId === 'headers' &&
      result.source.droppableId === 'groups'
    ) {
      const removeGroup = this.columns.find(
        c => c.tableData.id === Number(result.draggableId)
      );
      if(removeGroup) removeGroup.tableData.groupOrder = undefined;
      groups.splice(result.source.index, 1);
    } else if (
      result.destination &&
      result.destination.droppableId === 'headers' &&
      result.source.droppableId === 'headers'
    ) {
      start = Math.min(result.destination.index, result.source.index);
      const end = Math.max(result.destination.index, result.source.index);

      // get the effective start and end considering hidden columns
      const sorted = this.columns
        .sort((a, b) => (a.tableData.columnOrder ?? 0) - (b.tableData.columnOrder ?? 0))
        .filter(column => column.tableData.groupOrder === undefined);
      let numHiddenBeforeStart = 0;
      let numVisibleBeforeStart = 0;
      for (
        let i = 0;
        i < sorted.length && numVisibleBeforeStart <= start;
        i++
      ) {
        if (sorted[i].hidden) {
          numHiddenBeforeStart++;
        } else {
          numVisibleBeforeStart++;
        }
      }
      const effectiveStart = start + numHiddenBeforeStart;

      let effectiveEnd = effectiveStart;
      for (
        let numVisibleInRange = 0;
        numVisibleInRange < end - start && effectiveEnd < sorted.length;
        effectiveEnd++
      ) {
        if (!sorted[effectiveEnd].hidden) {
          numVisibleInRange++;
        }
      }
      const colsToMov = sorted.slice(effectiveStart, effectiveEnd + 1);

      if (result.destination.index < result.source.index) {
        // Take last and add as first
        const last = colsToMov.pop();
        last && colsToMov.unshift(last);
      } else {
        // Take first and add as last
        const last = colsToMov.shift();
        last && colsToMov.push(last);
      }

      for (let i = 0; i < colsToMov.length; i++) {
        colsToMov[i].tableData.columnOrder = effectiveStart + i;
      }

      return;
    } else {
      return;
    }

    for (let i = 0; i < groups.length; i++) {
      groups[i].tableData.groupOrder = start + i;
    }

    this.sorted = this.grouped = false;
  }

  startCellEditable = (rowData: T, columnDef: T )=> {
    rowData.tableData.editCellList = [
      ...(rowData.tableData.editCellList || []),
      columnDef,
    ];
  };

  finishCellEditable = (rowData: T, columnDef: T )=> {
    if (rowData.tableData.editCellList) {
      const index = rowData.tableData.editCellList.findIndex(
        c => c.tableData.id === columnDef.tableData.id
      );
      if (index !== -1) {
        rowData.tableData.editCellList.splice(index, 1);
      }
    }
  };

  clearBulkEditChangedRows = () => {
    this.bulkEditChangedRows = {};
  };

  onBulkEditRowChanged = (oldData: T, newData: T) => {
    this.bulkEditChangedRows[oldData.tableData.id] = {
      oldData,
      newData,
    };
  };

  onColumnResized(id: number, additionalWidth?: number) {
    const column = this.columns.find(c => c.tableData.id === id);
    if (!column) return;

    const nextColumn = this.columns.find(c => c.tableData.id === id + 1);
    if (!nextColumn) return;

    // console.log("S i: " + column.tableData.initialWidth);
    // console.log("S a: " + column.tableData.additionalWidth);
    // console.log("S w: " + column.tableData.width);

    column.tableData.additionalWidth = additionalWidth;
    column.tableData.width = `calc(${column.tableData.initialWidth} + ${column.tableData.additionalWidth}px)`;

    // nextColumn.tableData.additionalWidth = -1 * additionalWidth;
    // nextColumn.tableData.width = `calc(${nextColumn.tableData.initialWidth} + ${nextColumn.tableData.additionalWidth}px)`;

    // console.log("F i: " + column.tableData.initialWidth);
    // console.log("F a: " + column.tableData.additionalWidth);
    // console.log("F w: " + column.tableData.width);
  }

  expandTreeForNodes = (data: T[]) => {
    data.forEach(row => {
      let currentRow = row;
      while (this.parentFunc(currentRow, this.data)) {
        const parent = this.parentFunc(currentRow, this.data);
        if (parent) {
          parent.tableData.isTreeExpanded = true;
        }
        currentRow = parent;
      }
    });
  };

  findDataByPath = (renderData: T[], path: number[]): T |undefined=> {
    if (this.isDataType('tree')) {
      const node = path.reduce<any>(
        (result, current) => {
          return (
            result &&
            result.tableData &&
            result.tableData.childRows &&
            result.tableData.childRows[current]
          );
        },
        { tableData: { childRows: renderData} }
      );

      return node as T;
    } else {
      const data = { groups: renderData, tableData: {id: -1}, data: {} } as any as T;

      const node = path.reduce<T | undefined>((result, current) => {
        if(!result) return undefined;
        if ((result.groups?.length ?? 0) > 0) {
          return result.groups?.[current];
        } else if (result.data) {
          return (result.data as T[])[current] ;
        } else {
          return undefined;
        }
      }, data);
      return node;
    }
  };

  findGroupByGroupPath(renderData: T[], path: number[]) {
    const data = { groups: renderData, groupsIndex: this.rootGroupsIndex } as any as T;

    const node = path.reduce<T | undefined>((result, current) => {
      if (!result) {
        return undefined;
      }

      if (result.groupsIndex?.[current] !== undefined) {
        return result.groups?.[result.groupsIndex[current]];
      }
      return undefined;
      // const group = result.groups.find(a => a.value === current);
      // return group;
    }, data);
    return node;
  }

  getFieldValue = (rowData: T, columnDef: InternalColumn<T>, lookup = true) => {
    let value =
      columnDef.field !== undefined && 
      typeof rowData[columnDef.field] !== 'undefined'
        ? rowData[columnDef.field]
        : byString(rowData, String(columnDef.field));
    if (columnDef.lookup && lookup) {
      value = columnDef.lookup[value];
    }

    return value;
  };

  isDataType(type: 'normal' | 'tree' | 'group') {
    let dataType = 'normal';

    if (this.parentFunc) {
      dataType = 'tree';
    } else if (this.columns.find(a => (a.tableData?.groupOrder ?? -1)> -1)) {
      dataType = 'group';
    }

    return type === dataType;
  }
  
  sort(a: any, b:any, type?: ColumDefType): number {
    if (type === 'numeric') {
      return a - b;
    } else {
      if (a !== b) {
        // to find nulls
        if (!a) return -1;
        if (!b) return 1;
      }
      return a < b ? -1 : a > b ? 1 : 0;
    }
  }

  sortList(list: T[]) {
    const columnDef = this.columns.find(_ => _.tableData.id === this.orderBy);
    let result = list;

    if (columnDef && columnDef.customSort) {
      if (this.orderDirection === 'desc') {
        result = list.sort((a, b) => columnDef.customSort!(b, a, 'row', 'desc'));
      } else {
        result = list.sort((a, b) => columnDef.customSort!(a, b, 'row'));
      }
    } else {
      result = list.sort(
        this.orderDirection === 'desc'
          ? (a, b) =>
              this.sort(
                this.getFieldValue(b, columnDef!),
                this.getFieldValue(a, columnDef!),
                columnDef!.type
              )
          : (a, b) =>
              this.sort(
                this.getFieldValue(a, columnDef!),
                this.getFieldValue(b, columnDef!),
                columnDef!.type
              )
      );
    }

    return result;
  }

  getRenderState = (): IRenderState<T> => {
    if (this.filtered === false) {
      this.filterData();
    }

    if (this.searched === false) {
      this.searchData();
    }

    if (this.grouped === false && this.isDataType('group')) {
      this.groupData();
    }

    if (this.treefied === false && this.isDataType('tree')) {
      this.treefyData();
    }

    if (this.sorted === false) {
      this.sortData();
    }

    if (this.paged === false) {
      this.pageData();
    }

    return {
      columns: this.columns,
      currentPage: this.currentPage,
      data: this.sortedData,
      lastEditingRow: this.lastEditingRow,
      orderBy: this.orderBy,
      orderDirection: this.orderDirection,
      originalData: this.data,
      pageSize: this.pageSize,
      renderData: this.pagedData,
      searchText: this.searchText,
      selectedCount: this.selectedCount,
      treefiedDataLength: this.treefiedDataLength,
      treeDataMaxLevel: this.treeDataMaxLevel,
      groupedDataLength: this.groupedDataLength,
    };
  };

  // =====================================================================================================
  // DATA MANUPULATIONS
  // =====================================================================================================

  filterData = () => {
    this.searched = this.grouped = this.treefied = this.sorted = this.paged = false;

    this.filteredData = [...this.data];

    if (this.applyFilters) {
      this.columns
        .filter(columnDef => columnDef.tableData.filterValue)
        .forEach(columnDef => {
          const { lookup, type = "", tableData } = columnDef;
          if (columnDef.customFilterAndSearch) {
            this.filteredData = this.filteredData.filter(
              row =>
                !!columnDef.customFilterAndSearch!(
                  tableData.filterValue,
                  row,
                  columnDef
                )
            );
          } else {
            if (lookup) {
              this.filteredData = this.filteredData.filter(row => {
                const value = this.getFieldValue(row, columnDef, false);
                return (
                  !tableData.filterValue ||
                  tableData.filterValue.length === 0 ||
                  tableData.filterValue.indexOf(
                    value !== undefined && value !== null && (value as any).toString()
                  ) > -1
                );
              });
            } else if (type === 'numeric') {
              this.filteredData = this.filteredData.filter(row => {
                const value = this.getFieldValue(row, columnDef);
                return value + '' === tableData.filterValue;
              });
            } else if (type === 'boolean' && tableData.filterValue) {
              this.filteredData = this.filteredData.filter(row => {
                const value = this.getFieldValue(row, columnDef);
                return (
                  (value && tableData.filterValue === 'checked') ||
                  (!value && tableData.filterValue === 'unchecked')
                );
              });
            } else if (['date', 'datetime'].includes(type)) {
              this.filteredData = this.filteredData.filter(row => {
                const value = this.getFieldValue(row, columnDef);

                const currentDate = value ? new Date(value as number) : null;

                if (currentDate && currentDate.toString() !== 'Invalid Date') {
                  const selectedDate = tableData.filterValue as any as Date;
                  let currentDateToCompare = '';
                  let selectedDateToCompare = '';

                  if (type === 'date') {
                    currentDateToCompare = formatDate(
                      currentDate,
                      'MM/dd/yyyy'
                    );
                    selectedDateToCompare = formatDate(
                      selectedDate,
                      'MM/dd/yyyy'
                    );
                  } else if (type === 'datetime') {
                    currentDateToCompare = formatDate(
                      currentDate,
                      'MM/dd/yyyy - HH:mm'
                    );
                    selectedDateToCompare = formatDate(
                      selectedDate,
                      'MM/dd/yyyy - HH:mm'
                    );
                  }

                  return currentDateToCompare === selectedDateToCompare;
                }

                return true;
              });
            } else if (type === 'time') {
              this.filteredData = this.filteredData.filter(row => {
                const value = this.getFieldValue(row, columnDef);
                const currentHour = value || null;

                if (currentHour) {
                  const selectedHour = tableData.filterValue  as any as Date;
                  const currentHourToCompare = formatDate(
                    selectedHour,
                    'HH:mm'
                  );

                  return currentHour === currentHourToCompare;
                }

                return true;
              });
            } else {
              this.filteredData = this.filteredData.filter(row => {
                const value = this.getFieldValue(row, columnDef);
                return (
                  value &&
                  (value as any)
                    .toString()
                    .toUpperCase()
                    .includes((tableData.filterValue ?? "").toUpperCase())
                );
              });
            }
          }
        });
    }

    this.filtered = true;
  };

  searchData = () => {
    this.grouped = this.treefied = this.sorted = this.paged = false;

    this.searchedData = [...this.filteredData];

    if (this.searchText && this.applySearch) {
      const trimmedSearchText = this.searchText.trim();
      this.searchedData = this.searchedData.filter(row => {
        return this.columns
          .filter(columnDef => {
            return columnDef.searchable === undefined
              ? !columnDef.hidden
              : columnDef.searchable;
          })
          .some(columnDef => {
            if (columnDef.customFilterAndSearch) {
              return !!columnDef.customFilterAndSearch(
                trimmedSearchText,
                row,
                columnDef
              );
            } else if (columnDef.field) {
              const value = this.getFieldValue(row, columnDef);
              if (value) {
                return (value as any)
                  .toString()
                  .toUpperCase()
                  .includes(trimmedSearchText.toUpperCase());
              }
            }
          });
      });
    }
    this.searched = true;
  };

  groupData() {
    this.sorted = this.paged = false;
    this.groupedDataLength = 0;

    const tmpData = [...this.searchedData];

    const groups = this.columns
      .filter(col => (col.tableData.groupOrder ?? -1) > -1)
      .sort(
        (col1, col2) => (col1.tableData.groupOrder ?? -1) - (col2.tableData.groupOrder??-1)
      );

    const subData = tmpData.reduce<T>(
      (result, currentRow) => {
        let object = result;
        object = groups.reduce<T>((o, colDef) => {
          const value =
            (currentRow[colDef.field as keyof T] || byString(currentRow, colDef.field as string)) as string

          let group: T | undefined;
          
          if(!o.groups) {
            o.groups = [];
          }
          if(!o.groupsIndex) {
            o.groupsIndex = {};
          }
          if (o.groupsIndex[value] !== undefined) {
            group = o.groups[o.groupsIndex[value]];
          }

          if (!group) {
            const path = [...(o.path || []), value];
            const oldGroup = this.findGroupByGroupPath(
              this.groupedData,
              path
            ) || {
              isExpanded:
                typeof this.defaultExpanded === 'boolean'
                  ? this.defaultExpanded
                  : false,
            };

            group = {
              value,
              groups: [],
              groupsIndex: {},
              data: [],
              isExpanded: oldGroup.isExpanded,
              path: path,
            } as any as T;
            
            o.groups.push(group);
            o.groupsIndex[value] = o.groups.length - 1;
          }
          return group;
        }, object);

        object.data.push(currentRow);
        this.groupedDataLength++;

        return result;
      },
      { groups: [], groupsIndex: {} } as any as T
    );

    this.groupedData = subData.groups ?? [];
    this.grouped = true;
    this.rootGroupsIndex = subData.groupsIndex ?? [];
  }

  treefyData() {
    this.sorted = this.paged = false;
    this.data.forEach(a => (a.tableData.childRows = undefined));
    this.treefiedData = [];
    this.treefiedDataLength = 0;
    this.treeDataMaxLevel = 0;

    // if filter or search is enabled, collapse the tree
    if (
      this.searchText ||
      this.columns.some(columnDef => columnDef.tableData.filterValue)
    ) {
      this.data.forEach(row => {
        row.tableData.isTreeExpanded = false;
      });

      // expand the tree for all nodes present after filtering and searching
      this.expandTreeForNodes(this.searchedData);
    }

    const addRow = (rowData:T) => {
      rowData.tableData.markedForTreeRemove = false;
      const parent = this.parentFunc(rowData, this.data);
      if (parent) {
        parent.tableData.childRows = parent.tableData.childRows || [];
        if (!parent.tableData.childRows.includes(rowData)) {
          parent.tableData.childRows.push(rowData);
          this.treefiedDataLength++;
        }

        addRow(parent);

        rowData.tableData.path = [
          ...parent.tableData.path,
          parent.tableData.childRows.length - 1,
        ];
        this.treeDataMaxLevel = Math.max(
          this.treeDataMaxLevel,
          rowData.tableData.path.length
        );
      } else {
        if (!this.treefiedData.includes(rowData)) {
          this.treefiedData.push(rowData);
          this.treefiedDataLength++;
          rowData.tableData.path = [this.treefiedData.length - 1];
        }
      }
    };

    // Add all rows initially
    this.data.forEach(rowData => {
      addRow(rowData);
    });
    const markForTreeRemove = (rowData: T) => {
      let pointer = this.treefiedData;
      rowData.tableData.path?.forEach(pathPart => {
        if (!Array.isArray(pointer) && pointer.tableData && pointer.tableData.childRows) {
          pointer = pointer.tableData.childRows;
        }
        pointer = (pointer as T[])[pathPart];
      });
      (pointer as T).tableData.markedForTreeRemove = true;
    };

    const traverseChildrenAndUnmark = (rowData: T) => {
      if (rowData.tableData.childRows) {
        rowData.tableData.childRows.forEach(row => {
          traverseChildrenAndUnmark(row);
        });
      }
      rowData.tableData.markedForTreeRemove = false;
    };

    // for all data rows, restore initial expand if no search term is available and remove items that shouldn't be there
    this.data.forEach(rowData => {
      if (
        !this.searchText &&
        !this.columns.some(columnDef => columnDef.tableData.filterValue)
      ) {
        if (rowData.tableData.isTreeExpanded === undefined) {
          const isExpanded =
            typeof this.defaultExpanded === 'boolean' 
              ? this.defaultExpanded
              : this.defaultExpanded && this.defaultExpanded(rowData);
          rowData.tableData.isTreeExpanded = isExpanded;
        }
      }
      const hasSearchMatchedChildren = rowData.tableData.isTreeExpanded;

      if (!hasSearchMatchedChildren && this.searchedData.indexOf(rowData) < 0) {
        markForTreeRemove(rowData);
      }
    });

    // preserve all children of nodes that are matched by search or filters
    this.data.forEach(rowData => {
      if (this.searchedData.indexOf(rowData) > -1) {
        traverseChildrenAndUnmark(rowData);
      }
    });

    const traverseTreeAndDeleteMarked = (rowDataArray: T[]) => {
      for (let i = rowDataArray.length - 1; i >= 0; i--) {
        const item = rowDataArray[i];
        if (item.tableData.childRows) {
          traverseTreeAndDeleteMarked(item.tableData.childRows);
        }
        if (item.tableData.markedForTreeRemove) rowDataArray.splice(i, 1);
      }
    };

    traverseTreeAndDeleteMarked(this.treefiedData);
    this.treefied = true;
  }

  sortData() {
    this.paged = false;

    if (this.isDataType('group')) {
      this.sortedData = [...this.groupedData];

      const groups = this.columns
        .filter(col => (col.tableData.groupOrder ?? -1) > -1)
        .sort(
          (col1, col2) => (col1.tableData.groupOrder ?? -1)  - (col2.tableData.groupOrder ?? -1) 
        );

      const sortGroups = (list: T[], columnDef: InternalColumn<T>) => {
        if (columnDef.customSort) {
          return list.sort(
            columnDef.tableData.groupSort === 'desc'
              ? (a, b) => columnDef.customSort!(b.value, a.value, 'group')
              : (a, b) => columnDef.customSort!(a.value, b.value, 'group')
          );
        } else {
          return list.sort(
            columnDef.tableData.groupSort === 'desc'
              ? (a, b) => this.sort(b.value, a.value, columnDef.type)
              : (a, b) => this.sort(a.value, b.value, columnDef.type)
          );
        }
      };

      this.sortedData = sortGroups(this.sortedData, groups[0]);

      const sortGroupData = (list: T[], level: number) => {
        list.forEach(element => {
          if (element.groups && element.groups.length > 0) {
            const column = groups[level];
            element.groups = sortGroups(element.groups, column);
            sortGroupData(element.groups, level + 1);
          } else {
            if (this.orderBy >= 0 && this.orderDirection) {
              element.data = this.sortList(element.data);
            }
          }
        });
      };

      sortGroupData(this.sortedData, 1);
    } else if (this.isDataType('tree') && Array.isArray(this.treefiedData)) {
      this.sortedData = [...this.treefiedData];
      if (this.orderBy != -1) {
        this.sortedData = this.sortList(this.sortedData);

        const sortTree = (list: T[]) => {
          list.forEach(item => {
            if (item.tableData.childRows) {
              item.tableData.childRows = this.sortList(
                item.tableData.childRows
              );
              sortTree(item.tableData.childRows);
            }
          });
        };

        sortTree(this.sortedData);
      }
    } else if (this.isDataType('normal')) {
      this.sortedData = [...this.searchedData];
      if (this.orderBy != -1 && this.applySort) {
        this.sortedData = this.sortList(this.sortedData);
      }
    }

    this.sorted = true;
  }

  pageData() {
    this.pagedData = [...this.sortedData];

    if (this.paging) {
      const startIndex = this.currentPage * this.pageSize;
      const endIndex = startIndex + this.pageSize;

      this.pagedData = this.pagedData.slice(startIndex, endIndex);
    }

    this.paged = true;
  }
}
