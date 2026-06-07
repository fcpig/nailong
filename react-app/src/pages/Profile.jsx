import { useState, useMemo } from 'react';

const AVATARS = ['/nailong1.png', '/nailong2.png', '/nailong3.png', '/nailong4.png'];

export default function Profile({ profile, setProfile, records, onConfirm, onBack }) {
  const [name, setName] = useState(profile.name || '');
  const [avatar] = useState(profile.avatar || AVATARS[0]);

  const trimmed = name.trim();
  const valid = trimmed.length >= 2 && trimmed.length <= 10;
  const duplicate = useMemo(
    () => records.some(r => r.name === trimmed),
    [records, trimmed]
  );

  return (
    <div id="page1b" className="page active">
      <h1 className="p1b-title">设置资料</h1>
      <p className="p1b-sub">选择你的头像和昵称</p>

      <div className="p1b-card">
        <div className="p1b-avatar-wrap">
          <div className="p1b-avatar">
            <img src={avatar} alt="头像" />
          </div>
          <p className="p1b-avatar-hint">从下方选择头像</p>
        </div>

        <div className="p1b-random-avatars">
          {AVATARS.map((src) => (
            <img
              key={src}
              src={src}
              alt=""
              className={src === avatar ? 'selected' : ''}
              onClick={() => setProfile(p => ({ ...p, avatar: src }))}
            />
          ))}
        </div>

        <div className="p1b-input-group">
          <label>昵称</label>
          <input
            type="text"
            value={name}
            placeholder="请输入昵称（2-10个字）"
            maxLength={10}
            onChange={(e) => {
              setName(e.target.value);
              setProfile(p => ({ ...p, name: e.target.value }));
            }}
          />
        </div>

        {duplicate && (
          <div className="p1b-duplicate show">
            <p>这个昵称已经存在了，确认后会跳到历史记录</p>
            <button className="history-btn" onClick={onBack}>返回</button>
          </div>
        )}

        <button
          className="p1b-btn"
          disabled={!valid}
          onClick={() => onConfirm?.()}
        >
          下一步：摆手势开始 →
        </button>
      </div>
    </div>
  );
}
