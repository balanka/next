
import type { ITableProps, Row } from '../props/tableProps';

export function elementSize<T extends Row<T>> (props: ITableProps<T>) {
  return   props.options.padding === 'default' ? 'medium' : 'small';
}

export function baseIconSize <T extends Row<T>> (props: ITableProps<T>) {
  return elementSize(props) === 'medium' ? 48 : 32;
}

export function rowActions <T extends Row<T>> (props: ITableProps<T>) {
  return props.actions.filter(a => typeof a === 'function' || a.position === 'row' );
}
export function actionsColumnWidth <T extends Row<T>> (props: ITableProps<T>) {
  return rowActions(props).length * baseIconSize(props);
}
export function selectionMaxWidth<T extends Row<T>> (props:  ITableProps<T>, maxTreeLevel: number){

  return baseIconSize(props) + 9 * maxTreeLevel;
}

export const reducePercentsInCalc = (calc: string, fullValue = 1) => {
  const captureGroups = calc.match(/(\d*)%/);
  if (captureGroups && captureGroups.length > 1) {
    const percentage = Number(captureGroups[1]);
    return calc.replace(/\d*%/, `${fullValue * (percentage / 100)}px`);
  }
  return calc.replace(/\d*%/, `${fullValue}px`);
};
