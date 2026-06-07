import { useState, useEffect, useMemo, useRef } from 'react';

/**
 * useLocalState - 自动持久化到 localStorage 的 state
 *
 * 持久化策略（保证评分永久保存）：
 * 1) 主 key 写入：保证主流程可用
 * 2) 多个备份 key 写入：防止主 key 被清空/失败时数据丢失
 * 3) 初始化时从主 key + 所有备份 key 中合并去重，取最新数据
 * 4) 每次 setValue 后立即同步写盘（用 ref 标记，避免 effect 异步导致丢失）
 *
 * 用法：const [value, setValue] = useLocalState('xxx', defaultValue)
 */
export function useLocalState(key, defaultValue) {
  // 备份 key 列表（按优先级排序）：用 useMemo 稳定引用，避免每次渲染重建
  const backupKeys = useMemo(() => [`${key}_b1`, `${key}_b2`], [key]);

  const [value, setValue] = useState(() => {
    return readWithFallback(key, backupKeys, defaultValue);
  });

  // 标记是否需要立即同步写盘（用于关键节点：评分完成等）
  const pendingFlush = useRef(false);

  useEffect(() => {
    writeWithBackup(key, backupKeys, value);
    pendingFlush.current = false;
  }, [key, value, backupKeys]);

  // 包装 setValue：支持第三个参数 { flush: true } 立即同步写盘
  const setValueSafe = (updater, opts) => {
    pendingFlush.current = !!opts?.flush;
    setValue(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      // 关键数据：跳过 effect 异步、立即写一次
      if (opts?.flush) {
        try {
          writeWithBackup(key, backupKeys, next);
        } catch (e) {
          console.warn('localStorage 立即写入失败', e);
        }
      }
      return next;
    });
  };

  return [value, setValueSafe];
}

/**
 * 从主 key + 备份 key 中读取最完整的数据（按去重合并）
 */
function readWithFallback(key, backupKeys, defaultValue) {
  try {
    // 1) 先读主 key
    let merged = readKey(key) || [];

    // 2) 读所有备份 key，合并去重
    for (const bk of backupKeys) {
      const bak = readKey(bk);
      if (Array.isArray(bak) && bak.length > 0) {
        merged = dedupeMerge(merged, bak);
      }
    }

    return merged && merged.length > 0 ? merged : defaultValue;
  } catch {
    return defaultValue;
  }
}

function readKey(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * 同时写入主 key 和所有备份 key（任一写入失败不影响其他）
 */
function writeWithBackup(key, backupKeys, value) {
  const json = JSON.stringify(value);
  try { localStorage.setItem(key, json); } catch (e) {
    console.warn(`localStorage[${key}] 写入失败`, e);
  }
  for (const bk of backupKeys) {
    try { localStorage.setItem(bk, json); } catch (e) {
      console.warn(`localStorage[${bk}] 备份写入失败`, e);
    }
  }
}

/**
 * 合并去重（按 name+timestamp+score 标识唯一记录）
 */
function dedupeMerge(a, b) {
  const key = r => `${r.name}|${r.timestamp}|${(r.score ?? 0).toFixed(2)}`;
  const seen = new Set((Array.isArray(a) ? a : []).map(key));
  const out = [...(Array.isArray(a) ? a : [])];
  for (const r of (Array.isArray(b) ? b : [])) {
    if (r && typeof r.name === 'string' && !seen.has(key(r))) {
      out.push(r);
      seen.add(key(r));
    }
  }
  return out;
}

/**
 * useLatestRef - 拿到最新值的 ref（避免闭包陷阱）
 */
export function useLatestRef(value) {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }, [value]);
  return ref;
}
