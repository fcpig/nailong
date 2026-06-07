import { useEffect, useRef, useState } from 'react';

/**
 * Camera - 摄像头 + OK 手势识别
 * 用 MediaPipe Hands 检测 OK 手势，识别成功后触发 onOK
 */
export default function Camera({ onOK, onBack }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handsRef = useRef(null);
  const streamRef = useRef(null);
  const [recognized, setRecognized] = useState(false);
  const [status, setStatus] = useState('wait');

  useEffect(() => {
    let mounted = true;
    let rafId = 0;
    let okTimer = 0;

    async function init() {
      // 启动摄像头
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        canvasRef.current.width = 640;
        canvasRef.current.height = 480;
      } catch (e) {
        console.error('摄像头启动失败', e);
        return;
      }

      // 初始化 MediaPipe Hands
      const Hands = window.Hands;
      if (!Hands) {
        console.error('MediaPipe Hands 未加载');
        return;
      }
      const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5,
      });
      hands.onResults(onResults);
      handsRef.current = hands;

      // 逐帧处理
      async function processFrame() {
        if (!mounted || !videoRef.current || videoRef.current.readyState < 2) {
          rafId = requestAnimationFrame(processFrame);
          return;
        }
        try {
          await hands.send({ image: videoRef.current });
        } catch (e) {
          console.warn(e);
        }
        rafId = requestAnimationFrame(processFrame);
      }
      processFrame();
    }

    let triggered = false;
    function onResults(results) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        // 绘制关键点
        const drawUtils = window.drawConnectors || window.drawLandmarks;
        if (window.drawConnectors) {
          window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, { color: '#FFD93D', lineWidth: 4 });
          window.drawLandmarks(ctx, landmarks, { color: '#FF6B35', lineWidth: 2, radius: 4 });
        }

        // 检测 OK 手势：拇指尖和食指尖接近，其他三指伸展
        // 只触发一次，避免连续帧反复调用 onOK
        if (!triggered && checkOKGesture(landmarks)) {
          triggered = true;
          setStatus('ok');
          setRecognized(true);
          okTimer = setTimeout(() => onOK?.(), 800);
        }
      }
      ctx.restore();
    }

    init();

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
      if (okTimer) clearTimeout(okTimer);
      if (handsRef.current) handsRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div id="page1" className="page active">
      <div className="p1-header">
        <h2>对着摄像头比个 OK 👌</h2>
        <p>{recognized ? '识别成功！正在进入下一步...' : '用任意一只手比 OK 手势即可'}</p>
      </div>

      <div className="p1-cam-wrap">
        <video ref={videoRef} playsInline muted />
        <canvas ref={canvasRef} />
      </div>

      <div className={`p1-status ${status}`}>
        {status === 'wait' ? (
          <>
            <div className="p1-hand-icon">👌</div>
            <div>等待识别...</div>
          </>
        ) : (
          <div>✓ 识别成功！</div>
        )}
      </div>

      {onBack && (
        <button
          onClick={onBack}
          style={{
            marginTop: 15,
            padding: '10px 25px',
            background: 'rgba(255,255,255,.2)',
            color: '#FFF',
            border: '2px solid rgba(255,255,255,.4)',
            borderRadius: 999,
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          ← 返回
        </button>
      )}
    </div>
  );
}

// 简单 OK 手势检测
function checkOKGesture(lm) {
  // 拇指尖 (4) 与食指尖 (8) 距离
  const d = Math.hypot(lm[4].x - lm[8].x, lm[4].y - lm[8].y);
  // 拇指与食指并拢 = OK
  if (d > 0.08) return false;
  // 中指 (12)、无名指 (16)、小指 (20) 伸展 = 指尖 y < 关节 y
  const extended = (tip, pip) => lm[tip].y < lm[pip].y - 0.02;
  return extended(12, 10) && extended(16, 14) && extended(20, 18);
}
