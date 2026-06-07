import { useCallback } from 'react';
import { useLocalState } from './useLocalState.js';
import { sortAndTrimRecords, addRecord as utilAdd, mergeRecords as utilMerge } from '../utils/ranking.js';

const KEY = 'nailong_scores_v2';

/**
 * useRanking - 排行榜数据 hook（自动持久化到 localStorage）
 * - records: 当前所有记录
 * - addRecord({ name, avatar, score, difficulty }): 添加单条（立即落盘）
 * - mergeRecords(arr): 合并去重（立即落盘）
 * - replaceRecords(arr): 整体替换（立即落盘）
 * - clear(): 清空（立即落盘）
 *
 * 持久化：useLocalState 内部已支持多 key 备份 + 合并恢复
 */
export function useRanking() {
  const [records, setRecords] = useLocalState(KEY, []);

  const addRecord = useCallback((rec) => {
    setRecords(prev => utilAdd(prev, rec), { flush: true });
  }, [setRecords]);

  const mergeRecords = useCallback((incoming) => {
    setRecords(prev => utilMerge(prev, incoming), { flush: true });
  }, [setRecords]);

  const replaceRecords = useCallback((incoming) => {
    setRecords(sortAndTrimRecords(incoming), { flush: true });
  }, [setRecords]);

  const clear = useCallback(() => {
    setRecords([], { flush: true });
  }, [setRecords]);

  return { records, addRecord, mergeRecords, replaceRecords, clear };
}
