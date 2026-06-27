import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../auth/AuthContext';

export const normalizeCommitteeId = (id) => {
  if (id == null || id === '') return null;
  const parsed = Number(id);
  return Number.isFinite(parsed) ? parsed : null;
};

export function useCommitteeSession() {
  const auth = useAuth();

  const committeeId = useMemo(() => {
    if (auth.user?.role !== 'Committee') return null;
    return normalizeCommitteeId(auth.user?.id);
  }, [auth.user]);

  const getApiError = useCallback(
    (err, fallback) => err?.response?.data?.message || fallback,
    []
  );

  return {
    committeeId,
    user: auth.user,
    isReady: committeeId != null,
    getApiError,
  };
}

export function useCommitteeData(loader, deps = []) {
  const { committeeId, isReady, getApiError } = useCommitteeSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!isReady) {
      setLoading(false);
      setError('Không xác định được tài khoản hội đồng.');
      setData(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setData(await loader(committeeId));
    } catch (err) {
      setError(getApiError(err, 'Không thể tải dữ liệu.'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [committeeId, getApiError, isReady, ...deps]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, committeeId, isReady };
}
