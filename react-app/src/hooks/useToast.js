import { useState, useEffect, useCallback } from 'react';

/**
 * useToast - 简单的 toast 提示 hook
 * const { toast, show } = useToast();
 * show('操作成功', 'success');
 */
export function useToast() {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  return { toast, show };
}
