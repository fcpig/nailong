export default function DropOverlay({ show }) {
  return (
    <div className={`drop-overlay ${show ? 'show' : ''}`}>
      <div className="icon">📂</div>
      <div className="text">松开鼠标导入排行榜</div>
      <div className="hint">支持 .json 文件</div>
    </div>
  );
}
