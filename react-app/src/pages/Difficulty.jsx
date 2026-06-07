export default function Difficulty({ profile, onPick }) {
  return (
    <div id="page2" className="page active">
      <h1 className="p2-title">选择难度</h1>

      <div className="p2-user-info">
        <img src={profile.avatar} alt={profile.name} />
        <span>{profile.name}</span>
      </div>

      <div className="p2-cards">
        <div className="p2-card" onClick={() => onPick('easy')}>
          <div className="icon">🌱</div>
          <h3>入门模式</h3>
          <p>基础动作 · 节奏舒缓</p>
          <div className="time">25秒</div>
        </div>

        <div className="p2-card" onClick={() => onPick('hard')}>
          <div className="icon">🔥</div>
          <h3>超难模式</h3>
          <p>进阶动作 · 高强度训练</p>
          <div className="time">55秒</div>
        </div>

        <div className="p2-card" onClick={() => onPick('recorded')}>
          <div className="icon">🎬</div>
          <h3>跟随录制的舞蹈</h3>
          <p>使用你录制的关键帧作为评分标准</p>
          <div className="time">25秒</div>
        </div>
      </div>
    </div>
  );
}
