import { useMemo } from 'react';

const STARS = ['⭐', '✨', '🌟', '💫', '⭐', '🌟', '✨', '💫'];
const NOTES = ['♪', '♫', '♬', '♩', '♭', '♮'];

/**
 * Decorations - 开场页的浮动装饰（星星 + 音符）
 * 随机位置/动画延迟，刷新后稳定
 */
export default function Decorations() {
  const stars = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i,
    ch: STARS[i % STARS.length],
    left: Math.random() * 95,
    top: Math.random() * 90,
    delay: Math.random() * 2,
  })), []);

  const notes = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    id: i,
    ch: NOTES[i % NOTES.length],
    left: Math.random() * 95,
    top: Math.random() * 90,
    delay: Math.random() * 3,
  })), []);

  return (
    <div className="p0-stars">
      {stars.map(s => (
        <span
          key={`s${s.id}`}
          className="p0-star"
          style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${s.delay}s` }}
        >
          {s.ch}
        </span>
      ))}
      {notes.map(n => (
        <span
          key={`n${n.id}`}
          className="p0-note"
          style={{ left: `${n.left}%`, top: `${n.top}%`, animationDelay: `${n.delay}s` }}
        >
          {n.ch}
        </span>
      ))}
    </div>
  );
}
