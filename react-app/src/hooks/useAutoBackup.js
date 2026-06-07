import { useEffect } from 'react';
import { mergeRecords as utilMerge } from '../utils/ranking.js';

/**
 * useAutoBackup - 页面加载时：
 * 1. 尝试 fetch 同目录的 nailong_ranking_backup.json，自动合并
 * 2. 提示恢复 localStorage 中的最新快照
 */
export function useAutoBackup({ records, mergeRecords, showToast }) {
  useEffect(() => {
    let cancelled = false;

    // 1) 同目录自动加载
    (async () => {
      try {
        const res = await fetch('/nailong_ranking_backup.json', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (!data || !Array.isArray(data.records) || data.records.length === 0) return;

        const beforeCount = records.length;
        const next = utilMerge(records, data.records);
        if (next.length > beforeCount) {
          mergeRecords(data.records);
          showToast?.(`从同目录备份自动加载，新增 ${next.length - beforeCount} 条`, 'success');
        }
      } catch (e) {
        // file:// 协议下 fetch 会失败，正常忽略
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
