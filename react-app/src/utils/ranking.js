// 排行榜数据工具：纯函数 + localStorage 副作用
const RECORDS_KEY = 'nailong_scores_v2';
const SNAPSHOT_KEY = 'nailong_snapshot_v2';
// 备份 key：多副本冗余存储，防止主 key 丢失导致评分消失
const RECORDS_KEY_B1 = 'nailong_scores_v2_b1';
const RECORDS_KEY_B2 = 'nailong_scores_v2_b2';
const SNAPSHOT_KEY_B1 = 'nailong_snapshot_v2_b1';
const SNAPSHOT_KEY_B2 = 'nailong_snapshot_v2_b2';
const MAX_RECORDS = 1000;

// 校验单条记录
export function isValidRecord(r) {
  return r && typeof r.name === 'string' && typeof r.score === 'number' && typeof r.timestamp === 'number';
}

// 排序并裁剪
export function sortAndTrimRecords(records) {
  const sorted = [...records].sort((a, b) => b.score - a.score);
  if (sorted.length > MAX_RECORDS) sorted.length = MAX_RECORDS;
  return sorted;
}

// 添加单条
export function addRecord(records, rec) {
  return sortAndTrimRecords([...records, {
    name: rec.name || '匿名',
    avatar: rec.avatar,
    score: Math.min(100, Math.max(0, rec.score)),
    difficulty: rec.difficulty === 'easy' ? '入门' : '超难',
    date: new Date().toLocaleString('zh-CN'),
    timestamp: Date.now(),
  }]);
}

// 合并去重（按 name+timestamp+score）
export function mergeRecords(records, incoming) {
  const key = r => `${r.name}|${r.timestamp}|${r.score.toFixed(2)}`;
  const exist = new Set(records.map(key));
  const merged = [...records];
  for (const r of incoming) {
    if (isValidRecord(r) && !exist.has(key(r))) {
      merged.push(r);
      exist.add(key(r));
    }
  }
  return sortAndTrimRecords(merged);
}

/**
 * 同步写入多 key：主 key + 多个备份 key
 * 任一写入失败不影响其他，确保数据不丢
 */
function writeMultiKey(primaryKey, backupKeys, value) {
  const json = JSON.stringify(value);
  try { localStorage.setItem(primaryKey, json); } catch (e) {
    console.warn(`localStorage[${primaryKey}] 写入失败`, e);
  }
  for (const bk of backupKeys) {
    try { localStorage.setItem(bk, json); } catch (e) {
      console.warn(`localStorage[${bk}] 备份写入失败`, e);
    }
  }
}

/**
 * 从多 key 读取并合并去重
 */
function readMultiKey(primaryKey, backupKeys) {
  let merged = readKeySafe(primaryKey) || [];
  for (const bk of backupKeys) {
    const v = readKeySafe(bk);
    if (Array.isArray(v) && v.length > 0) {
      merged = dedupeMerge(merged, v);
    }
  }
  return merged;
}

function readKeySafe(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

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

// 写入最新快照（多 key 冗余）
export function saveSnapshot(records) {
  const snap = {
    snapshotTime: Date.now(),
    records: records.slice(0, MAX_RECORDS),
  };
  writeMultiKey(SNAPSHOT_KEY, [SNAPSHOT_KEY_B1, SNAPSHOT_KEY_B2], snap);
}

// 读取快照（合并多 key）
export function loadSnapshot() {
  let best = readKeySafe(SNAPSHOT_KEY);
  // 如果主 key 缺失或异常，尝试备份 key
  if (!best || !Array.isArray(best.records)) {
    best = readKeySafe(SNAPSHOT_KEY_B1);
  }
  if (!best || !Array.isArray(best.records)) {
    best = readKeySafe(SNAPSHOT_KEY_B2);
  }
  if (!best || !Array.isArray(best.records)) return null;

  // 合并所有 key 中的 records（去重）：每个 key 存的是 {snapshotTime, records} 对象
  const allKeys = [SNAPSHOT_KEY, SNAPSHOT_KEY_B1, SNAPSHOT_KEY_B2];
  const allRecords = [];
  for (const k of allKeys) {
    const v = readKeySafe(k);
    if (v && Array.isArray(v.records)) {
      for (const r of v.records) allRecords.push(r);
    }
  }
  if (allRecords.length > 0) {
    best.records = dedupeMerge(best.records, allRecords);
  }
  return best;
}

// 读取记录（兼容旧版 key + 多 key 备份合并）
export function getAllRecords() {
  return readMultiKey(RECORDS_KEY, [RECORDS_KEY_B1, RECORDS_KEY_B2]);
}

// 强制保存记录到所有 key（供外部工具使用）
export function persistRecords(records) {
  writeMultiKey(RECORDS_KEY, [RECORDS_KEY_B1, RECORDS_KEY_B2], sortAndTrimRecords(records));
}

// 清空（同时清主 key + 备份 key）
export function clearRanking() {
  const keys = [RECORDS_KEY, RECORDS_KEY_B1, RECORDS_KEY_B2, SNAPSHOT_KEY, SNAPSHOT_KEY_B1, SNAPSHOT_KEY_B2];
  for (const k of keys) {
    try { localStorage.removeItem(k); } catch { /* 清空失败忽略 */ }
  }
}
