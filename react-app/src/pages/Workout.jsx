import { useEffect, useRef, useState } from 'react';
import { getActionsByMode, getRecordedDance, calcMatch } from '../utils/pose.js';

/**
 * Workout - 运动主界面
 * - 左侧：奶龙领舞视频
 * - 右侧：摄像头 + 姿态识别
 * 倒计时 3-2-1 后开始，循环执行动作列表
 *
 * difficulty: 'easy' | 'hard' | 'recorded'
 *   - 'recorded'：每秒对应一个录制关键帧作为评分标准
 */
export default function Workout({ profile, difficulty, onFinish, onAbort }) {
  const actions = getActionsByMode(difficulty);
  const totalTime = difficulty === 'easy' ? 25
                  : difficulty === 'hard' ? 55
                  : (getRecordedDance()?.duration || actions.length || 25);
  // 录制模式：每秒切换一个关键帧；其他模式：均匀切分
  const actionInterval = difficulty === 'recorded'
    ? 1
    : Math.max(1, Math.round(totalTime / actions.length));
  const [actionIdx, setActionIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(totalTime);
  const [displayScore, setDisplayScore] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [started, setStarted] = useState(false);
  const [match, setMatch] = useState(0);
  const [beat, setBeat] = useState(null);
  const finishedRef = useRef(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const nailongVideoRef = useRef(null);
  const poseRef = useRef(null);
  const streamRef = useRef(null);
  const poseIntervalRef = useRef(null);
  const beatIntervalRef = useRef(null);
  const workoutIntervalRef = useRef(null);
  const beatCountRef = useRef(0);
  const scoreRef = useRef(0);
  const matchCountRef = useRef(0);

  // 倒计时
  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    } else if (!started) {
      setStarted(true);
    }
  }, [countdown, started]);

  // 倒计时结束后初始化摄像头 + MediaPipe
  useEffect(() => {
    if (!started) return;
    let mounted = true;

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
      } catch (e) { console.error(e); }

      // 视频自动播放
      if (nailongVideoRef.current) {
        nailongVideoRef.current.play().catch(() => {});
      }

      // MediaPipe Pose
      const Pose = window.Pose;
      if (!Pose) { console.error('MediaPipe Pose 未加载'); return; }
      const pose = new Pose({
        locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
      });
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      pose.onResults(onPoseResults);
      poseRef.current = pose;

      let raf = 0;
      async function loop() {
        if (!mounted || !videoRef.current || videoRef.current.readyState < 2) {
          raf = requestAnimationFrame(loop); return;
        }
        try { await pose.send({ image: videoRef.current }); } catch (e) { console.warn(e); }
        raf = requestAnimationFrame(loop);
      }
      loop();

      // 保存到 ref 以便清理
      poseIntervalRef.current = { raf };
    }

    function onPoseResults(results) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      if (results.poseLandmarks) {
        if (window.drawConnectors) {
          window.drawConnectors(ctx, results.poseLandmarks, window.POSE_CONNECTIONS, { color: '#FFD93D', lineWidth: 3 });
          window.drawLandmarks(ctx, results.poseLandmarks, { color: '#FF6B35', lineWidth: 2, radius: 4 });
        }
        // 评分
        const target = actions[actionIdx];
        const m = calcMatch(results.poseLandmarks, target);
        setMatch(m);
        if (m > 60) {
          matchCountRef.current++;
          scoreRef.current = Math.min(100, scoreRef.current + 0.4);
          setDisplayScore(scoreRef.current);
        }
      }
      ctx.restore();
    }

    init();

    // 动作切换
    workoutIntervalRef.current = setInterval(() => {
      setActionIdx(i => (i + 1) % actions.length);
    }, actionInterval * 1000);

    // 总倒计时
    const totalTimer = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          if (!finishedRef.current) {
            finishedRef.current = true;
            onFinish?.(scoreRef.current);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    // 节拍 1-2-3-4
    beatIntervalRef.current = setInterval(() => {
      beatCountRef.current++;
      const n = (beatCountRef.current % 4) || 4;
      setBeat(n);
      setTimeout(() => setBeat(null), 250);
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(totalTimer);
      if (workoutIntervalRef.current) clearInterval(workoutIntervalRef.current);
      if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
      if (poseRef.current) poseRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (nailongVideoRef.current) nailongVideoRef.current.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  const progress = totalTime > 0 ? ((totalTime - secondsLeft) / totalTime) * 100 : 0;

  return (
    <div id="page3" className="page active">
      <div className="p3-top">
        <div className="p3-timer">{formatTime(secondsLeft)}</div>
        <div className="p3-action-name">{actions[actionIdx]?.name}</div>
        <div className="p3-score">{displayScore.toFixed(0)} 分</div>
      </div>

      <div className="p3-progress">
        <div className="p3-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="p3-left">
        <video ref={nailongVideoRef} autoPlay loop muted playsInline preload="auto"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}>
          <source src="/nailong_demo.mp4" type="video/mp4" />
        </video>
        <div className="p3-left-fallback">
          <div className="icon">📹</div>
          <div className="text">请将示范视频命名为<br /><b>nailong_demo.mp4</b><br />并放在 public 目录</div>
        </div>
        <div className="p3-left-label">🦖 奶龙领舞</div>
      </div>

      <div className="p3-right">
        <video ref={videoRef} playsInline muted />
        <canvas ref={canvasRef} />
        <div className="p3-right-label">📷 你</div>
      </div>

      <div className="p3-match">
        动作匹配: <span className="star">{'★'.repeat(Math.round(match / 20))}</span>{'☆'.repeat(5 - Math.round(match / 20))} {match.toFixed(0)}%
      </div>

      {countdown > 0 && (
        <div className="p3-countdown" style={{ display: 'block' }}>{countdown}</div>
      )}
      {beat && <div className="p3-beat">{beat}</div>}

      <button
        onClick={onAbort}
        style={{
          position: 'absolute', top: 75, right: 180,
          padding: '6px 14px', fontSize: 14, fontWeight: 'bold',
          background: 'rgba(0,0,0,.5)', color: '#FFF', border: '2px solid rgba(255,255,255,.3)',
          borderRadius: 999, cursor: 'pointer', zIndex: 30,
        }}
      >
        ✕ 结束
      </button>
    </div>
  );
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
