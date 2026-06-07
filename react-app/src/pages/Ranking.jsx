export default function Ranking({ profile, records, onHome, onAgain }) {
  // 排序，按分数从高到低取前 100
  const top = [...records].sort((a, b) => b.score - a.score).slice(0, 100);

  return (
    <div id="page4" className="page active">
      <h1 className="p2h-title">🏆 排行榜</h1>
      <p className="p4-sub">💪 坚持就是胜利！</p>

      <div className="p2h-avatar" style={{ width: 80, height: 80 }}>
        <img src={profile.avatar} alt={profile.name} />
      </div>
      <div className="p2h-name">{profile.name}</div>
      <p className="p4-count">总记录数：{records.length} 条</p>

      <div className="p4-table">
        {top.length === 0 ? (
          <div className="p4-empty">还没有任何记录哦~</div>
        ) : (
          top.map((r, i) => (
            <div
              key={`${r.name}-${r.timestamp}-${i}`}
              className={`p4-row ${r.name === profile.name && r.avatar === profile.avatar ? 'highlight' : ''}`}
            >
              <div className="p4-rank">{i + 1}</div>
              <div className="p4-avatar">
                <img src={r.avatar} alt="" />
              </div>
              <div className="p4-info">
                <div className="p4-name">{r.name}</div>
                <div className="p4-meta">{r.difficulty} · {r.date}</div>
              </div>
              <div className="p4-score">{r.score.toFixed(0)}分</div>
            </div>
          ))
        )}
      </div>

      <div className="p4-btns">
        <button className="p4-btn primary" onClick={onHome}>🏠 返回首页</button>
        <button className="p4-btn secondary" onClick={onAgain}>🔄 再来一次</button>
      </div>
    </div>
  );
}
