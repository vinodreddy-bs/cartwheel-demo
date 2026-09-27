import { useCallback, useEffect, useState } from 'react';

export function useRemote(loader) {
  const [state, setState] = useState({ status: 'loading', data: null, error: '' });
  const reload = useCallback(async () => {
    setState((s) => ({ ...s, status: s.data ? 'ready' : 'loading', error: '' }));
    try {
      setState({ status: 'ready', data: await loader(), error: '' });
    } catch (err) {
      setState((s) => ({ ...s, status: 'error', error: err.message }));
    }
  }, [loader]);
  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload };
}
