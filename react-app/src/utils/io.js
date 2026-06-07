// 导入导出 JSON
import { isValidRecord, mergeRecords, sortAndTrimRecords, saveSnapshot, clearRanking as clear } from './ranking.js';

const APP_NAME = '奶龙健身操';

// 导出排行榜到本地文件
export function exportRanking(records) {
  if (records.length === 0) {
    return { ok: false, error: '暂无数据可导出' };
  }
  const data = {
    app: APP_NAME,
    version: 2,
    exportTime: new Date().toLocaleString('zh-CN'),
    exportTimestamp: Date.now(),
    count: records.length,
    records,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const ts = new Date();
  const fname = `奶龙排行榜_${ts.getFullYear()}${String(ts.getMonth() + 1).padStart(2, '0')}${String(ts.getDate()).padStart(2, '0')}_${String(ts.getHours()).padStart(2, '0')}${String(ts.getMinutes()).padStart(2, '0')}.json`;
  a.href = url;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return { ok: true, count: records.length };
}

// 从 File 对象导入
export function importFromFile(file, { records, replaceRecords, mergeRecords: doMerge, showToast, onDone }) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.records || !Array.isArray(data.records)) {
        showToast?.('文件格式错误', 'error');
        return;
      }
      const valid = data.records.filter(isValidRecord);
      if (valid.length === 0) {
        showToast?.('文件中没有有效记录', 'error');
        return;
      }
      const mode = window.confirm(
        `检测到 ${valid.length} 条有效记录\n\n` +
        `点击 "确定" = 合并到当前排行榜（去重）\n` +
        `点击 "取消" = 替换当前排行榜`
      );
      if (mode) {
        const before = records.length;
        doMerge(valid);
        showToast?.(`合并完成，新增 ${valid.length} 条记录`, 'success');
      } else {
        replaceRecords(sortAndTrimRecords(valid));
        showToast?.(`已替换为 ${valid.length} 条记录`, 'success');
      }
      onDone?.();
    } catch (err) {
      console.error(err);
      showToast?.('文件解析失败：' + err.message, 'error');
    }
  };
  reader.readAsText(file, 'UTF-8');
}

// 清空（带确认）
export function clearRankingWithConfirm(clearFn, showToast) {
  if (!window.confirm('确定要清空所有排行榜数据吗？\n建议先导出备份！\n此操作不可恢复！')) return;
  if (!window.confirm('再次确认：真的要删除所有数据吗？')) return;
  clear();
  if (showToast) showToast('排行榜已清空', 'success');
}
