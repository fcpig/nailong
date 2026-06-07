// 动作库 + 评分算法
// 注：MediaPipe Pose 的 33 个关键点索引参考官方文档
import recordedDanceData from '../data/recordedDance.json';

const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
};

// 计算三点夹角
export function calcAngle(a, b, c) {
  if (!a || !b || !c) return null;
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mab = Math.hypot(ab.x, ab.y);
  const mcb = Math.hypot(cb.x, cb.y);
  if (mab === 0 || mcb === 0) return null;
  const cos = Math.max(-1, Math.min(1, dot / (mab * mcb)));
  return Math.acos(cos) * 180 / Math.PI;
}

// 计算用户姿态与目标角度的相似度（0-100）
export function calcMatch(landmarks, target) {
  if (!landmarks || !target) return 0;
  let total = 0;
  let count = 0;
  for (const [key, targetAngle] of Object.entries(target.angles)) {
    const angles = keyAngles[key];
    if (!angles) continue;
    const a = landmarks[angles[0]];
    const b = landmarks[angles[1]];
    const c = landmarks[angles[2]];
    const userAngle = calcAngle(a, b, c);
    if (userAngle == null) continue;
    const diff = Math.abs(userAngle - targetAngle);
    total += Math.max(0, 100 - diff);
    count++;
  }
  return count > 0 ? total / count : 0;
}

// 关键点三元组
const keyAngles = {
  leftElbow: [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  rightElbow: [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  leftShoulder: [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  rightShoulder: [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  leftKnee: [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  rightKnee: [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
};

// 动作库
export const ACTIONS = {
  easy: [
    { name: '脊柱热身', pose: 'spine_warm', angles: { leftShoulder: 90, rightShoulder: 90, leftElbow: 180, rightElbow: 180 } },
    { name: '手肘画圈', pose: 'elbow_circle', angles: { leftElbow: 90, rightElbow: 90, leftShoulder: 90, rightShoulder: 90 } },
    { name: '颈部侧弯', pose: 'neck_side', angles: { leftShoulder: 90, rightShoulder: 90, leftElbow: 180, rightElbow: 180 } },
    { name: '颈部后仰', pose: 'neck_back', angles: { leftShoulder: 100, rightShoulder: 100, leftElbow: 180, rightElbow: 180 } },
    { name: '颈部前屈', pose: 'neck_fwd', angles: { leftShoulder: 80, rightShoulder: 80, leftElbow: 180, rightElbow: 180 } },
    { name: '牛面式', pose: 'cow_face', angles: { leftElbow: 60, rightElbow: 60, leftShoulder: 100, rightShoulder: 100 } },
    { name: '动态夹肘', pose: 'elbow_squeeze', angles: { leftElbow: 45, rightElbow: 45, leftShoulder: 90, rightShoulder: 90 } },
    { name: '手肘开合', pose: 'elbow_open', angles: { leftElbow: 90, rightElbow: 90, leftShoulder: 90, rightShoulder: 90 } },
  ],
  hard: [
    { name: '手臂外旋', pose: 'arm_rotate', angles: { leftElbow: 90, rightElbow: 90, leftShoulder: 90, rightShoulder: 90 } },
    { name: '扭头看', pose: 'head_turn', angles: { leftShoulder: 90, rightShoulder: 90, leftElbow: 180, rightElbow: 180 } },
    { name: '肩部环绕(前)', pose: 'shoulder_fwd', angles: { leftElbow: 120, rightElbow: 120, leftShoulder: 100, rightShoulder: 100 } },
    { name: '肩部环绕(后)', pose: 'shoulder_bwd', angles: { leftElbow: 120, rightElbow: 120, leftShoulder: 100, rightShoulder: 100 } },
    { name: '扭腰', pose: 'waist_twist', angles: { leftShoulder: 90, rightShoulder: 90, leftElbow: 90, rightElbow: 90 } },
    { name: '全身伸展', pose: 'arms_up', angles: { leftElbow: 180, rightElbow: 180, leftShoulder: 150, rightShoulder: 150 } },
    { name: '抬腿', pose: 'leg_raise', angles: { leftKnee: 180, rightKnee: 90, leftHip: 90, rightHip: 90 } },
    { name: '深蹲', pose: 'squat', angles: { leftKnee: 90, rightKnee: 90, leftHip: 90, rightHip: 90 } },
    { name: '终极舒展', pose: 'full_stretch', angles: { leftElbow: 180, rightElbow: 180, leftShoulder: 150, rightShoulder: 150, leftKnee: 180, rightKnee: 180 } },
    { name: '深呼吸收尾', pose: 'breathe', angles: { leftElbow: 150, rightElbow: 150, leftShoulder: 90, rightShoulder: 90 } },
  ],
};

export function getActions(difficulty) {
  return difficulty === 'easy' ? ACTIONS.easy : ACTIONS.hard;
}

// 录制舞蹈评分标准：从 src/data/recordedDance.json 读取
// 使用方法：把你从 nailong_fitness.html 导出的 JSON 内容覆盖此文件即可
// difficulty: 'easy' | 'hard'
export function getRecordedDance(difficulty = 'easy') {
  const level = difficulty === 'hard' ? 'hard' : 'easy';
  return recordedDanceData[level] || null;
}

// 把录制数据转成 actions 数组（每秒 = 1 个动作）
export function getRecordedActions(difficulty = 'easy') {
  const data = getRecordedDance(difficulty);
  if (!data || !Array.isArray(data.keyframes) || data.keyframes.length === 0) {
    return [];
  }
  return data.keyframes.map((k, i) => ({
    name: `第 ${i + 1} 秒 · 跟随关键帧`,
    pose: null,
    t: k.t,
    angles: k.angles,
  }));
}

// 统一入口：根据 difficulty 返回动作列表
// difficulty: 'easy' | 'hard' | 'recorded-easy' | 'recorded-hard'
export function getActionsByMode(difficulty) {
  if (difficulty === 'recorded-easy') return getRecordedActions('easy');
  if (difficulty === 'recorded-hard') return getRecordedActions('hard');
  return getActions(difficulty);
}
