import { useEffect, useState } from 'react';

/**
 * useDragDrop - 全局监听拖拽事件，识别 JSON 文件后调用 onFile
 * 返回 show: 是否正在拖拽（用于显示遮罩）
 */
export function useDragDrop({ onFile }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let counter = 0;

    const isJson = (e) => {
      const items = e.dataTransfer?.items;
      if (items && items.length > 0) {
        for (const it of items) {
          if (it.kind === 'file' && (it.type === 'application/json' || it.type === '')) return true;
        }
      }
      return false;
    };

    const onEnter = (e) => {
      if (!isJson(e)) return;
      e.preventDefault();
      counter++;
      setShow(true);
    };
    const onLeave = (e) => {
      e.preventDefault();
      counter--;
      if (counter <= 0) { counter = 0; setShow(false); }
    };
    const onOver = (e) => e.preventDefault();
    const onDrop = (e) => {
      e.preventDefault();
      counter = 0;
      setShow(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') return;
      onFile?.(file);
    };

    document.addEventListener('dragenter', onEnter);
    document.addEventListener('dragleave', onLeave);
    document.addEventListener('dragover', onOver);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragenter', onEnter);
      document.removeEventListener('dragleave', onLeave);
      document.removeEventListener('dragover', onOver);
      document.removeEventListener('drop', onDrop);
    };
  }, [onFile]);

  return show;
}
