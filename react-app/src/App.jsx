import { useState, useCallback, useEffect } from 'react';
import Home from './pages/Home.jsx';
import Camera from './pages/Camera.jsx';
import Profile from './pages/Profile.jsx';
import History from './pages/History.jsx';
import Difficulty from './pages/Difficulty.jsx';
import Workout from './pages/Workout.jsx';
import Ranking from './pages/Ranking.jsx';
import Toast from './components/Toast.jsx';
import DropOverlay from './components/DropOverlay.jsx';
import { useToast } from './hooks/useToast.js';
import { useRanking } from './hooks/useRanking.js';
import { useAutoBackup } from './hooks/useAutoBackup.js';
import { useDragDrop } from './hooks/useDragDrop.js';
import { importFromFile } from './utils/io.js';
import { saveSnapshot } from './utils/ranking.js';

// 页面 ID 常量（与原 HTML 保持一致语义）
export const PAGES = {
  HOME: 0,
  CAMERA: 1,
  PROFILE: '1b',
  HISTORY: '2h',
  DIFFICULTY: 2,
  WORKOUT: 3,
  RANKING: 4,
};

export default function App() {
  const [page, setPage] = useState(PAGES.HOME);
  const [difficulty, setDifficulty] = useState('easy');
  const [profile, setProfile] = useState({ name: '', avatar: '/nailong1.png' });
  const { records, addRecord, replaceRecords, mergeRecords } = useRanking();
  const { toast, show: showToast } = useToast();

  const goPage = useCallback((n) => setPage(n), []);

  // 回到首页即视为重新开始，清空当前账号（每次都需重新输入昵称）
  const goHome = useCallback(() => {
    setProfile({ name: '', avatar: '/nailong1.png' });
    setPage(PAGES.HOME);
  }, []);

  // records 每次变化都自动保存快照（用于跨会话恢复）
  useEffect(() => {
    saveSnapshot(records);
  }, [records]);

  // 启动时自动加载同目录备份 + 提示恢复快照
  useAutoBackup({ records, mergeRecords, showToast });

  // 全局拖拽导入
  const dragShow = useDragDrop({ onFile: handleImportFile });

  function handleImportFile(file) {
    importFromFile(file, {
      records,
      replaceRecords,
      mergeRecords,
      showToast,
    });
  }

  return (
    <>
      {page === PAGES.HOME && <Home onStart={() => goPage(PAGES.PROFILE)} />}

      {page === PAGES.PROFILE && (
        <Profile
          profile={profile}
          setProfile={setProfile}
          records={records}
          onBack={() => goPage(PAGES.HOME)}
          onConfirm={() => goPage(PAGES.CAMERA)}
        />
      )}

      {page === PAGES.CAMERA && (
        <Camera
          onOK={() => {
            // 手势确认：重名 → 跳历史页；否则 → 选难度
            const exists = records.some(r => r.name === profile.name);
            goPage(exists ? PAGES.HISTORY : PAGES.DIFFICULTY);
          }}
          onBack={() => goPage(PAGES.PROFILE)}
        />
      )}

      {page === PAGES.HISTORY && (
        <History
          profile={profile}
          records={records}
          onPlay={() => goPage(PAGES.CAMERA)}
          onChange={() => goPage(PAGES.PROFILE)}
        />
      )}

      {page === PAGES.DIFFICULTY && (
        <Difficulty
          profile={profile}
          onPick={(d) => {
            setDifficulty(d);
            goPage(PAGES.WORKOUT);
          }}
        />
      )}

      {page === PAGES.WORKOUT && (
        <Workout
          profile={profile}
          difficulty={difficulty}
          onFinish={(score) => {
            addRecord({ ...profile, score, difficulty });
            goPage(PAGES.RANKING);
          }}
          onAbort={() => goPage(PAGES.DIFFICULTY)}
        />
      )}

      {page === PAGES.RANKING && (
        <Ranking
          profile={profile}
          records={records}
          onHome={goHome}
          onAgain={() => goPage(PAGES.DIFFICULTY)}
        />
      )}

      {/* 全局浮层 */}
      <Toast toast={toast} />
      <DropOverlay show={dragShow} />
    </>
  );
}
