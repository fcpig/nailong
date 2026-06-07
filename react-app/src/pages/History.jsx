export default function History({ profile, records, onPlay, onChange }) {
  const myRecords = records
    .filter(r => r.name === profile.name)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20);

  return (
    <div id="page2h" className="page active">
      <h1 className="p2h-title">历史记录</h1>
      <p className="p2h-sub">看看你的成长轨迹</p>

      <div className="p2h-avatar">
        <img src={profile.avatar} alt={profile.name} />
      </div>
      <div className="p2h-name">{profile.name}</div>

      <div className="p2h-table">
        {myRecords.length === 0 ? (
          <div className="p2h-empty">还没有记录哦~ 来开始第一次健身吧！</div>
        ) : (
          myRecords.map((r, i) => (
            <div key={i} className="p2h-row">
              <div className="p2h-row-date">{r.date}</div>
              <div className={`p2h-row-diff ${r.difficulty === '入门' ? 'easy' : 'hard'}`}>
                {r.difficulty}
              </div>
              <div className="p2h-row-score">{r.score.toFixed(0)}分</div>
            </div>
          ))
        )}
      </div>

      <div className="p2h-btns">
        <button className="p2h-btn primary" onClick={onPlay}>🏃 开始运动</button>
        <button className="p2h-btn secondary" onClick={onChange}>🔄 换账号</button>
      </div>
    </div>
  );
}
