export function byString<T extends object>(o: T, s?: string) {
  if (!s) {
    return;
  }

  s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  s = s.replace(/^\./, ''); // strip a leading dot
  const a = s.split('.');
  for (let i = 0, n = a.length; i < n; ++i) {
    const x = a[i];
    if (o && x in o) {
      o = (o as any)[x];
    } else {
      return;
    }
  }
  return o;
}

export function setByString<T extends any>(
  obj: T,
  path: string,
  value: unknown
) {
  let schema = obj; // a moving reference to internal objects within obj

  path = path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  path = path.replace(/^\./, ''); // strip a leading dot
  const pList = path.split('.');
  const len = pList.length;
  for (let i = 0; i < len - 1; i++) {
    const elem = pList[i];
    if (!schema[elem]) schema[elem] = {};
    schema = schema[elem];
  }

  schema[pList[len - 1]] = value;
}
