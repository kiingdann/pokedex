// used everywhere instead of the classic isLoading/isError/data trio,
// so we can't end up in a weird state like loading + data at the same time
export type AsyncState<TData> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: TData };
