import Decorations from '../components/Decorations.jsx';

export default function Home({ onStart }) {
  return (
    <div id="page0" className="page active">
      <Decorations />

      <div className="p0-content">
        <div className="p0-nailong">
          <img src="/nailong1.png" alt="奶龙" />
        </div>

        <div className="p0-info">
          <h1 className="p0-title">奶龙健身操</h1>
          <p className="p0-sub">久坐？肩膀酸？跟我一起动起来~</p>

          <div className="p0-bubble">
            <div className="p0-bubble-text">
              <span className="p0-voice">🎤</span>
              入门 25 秒 / 超难 55 秒，缓解久坐疲劳！
            </div>
          </div>

          <div className="p0-reward">
            <div className="p0-reward-tag">🏆 活动奖励</div>
            <div className="p0-reward-text">
              完成两个视频 + 与奶龙合照，<br />
              <span className="p0-reward-highlight">第一名免运费获得优质奶龙罐头</span>，包邮到家！
            </div>
          </div>

          <button className="p0-btn" onClick={onStart}>
            🦖 开始运动
          </button>
        </div>
      </div>

      <div className="p0-wave" />
    </div>
  );
}
