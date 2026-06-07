"""
奶龙桌面宠物
- 静止放置在 Windows 桌面右下角（无边框、透明、置顶）
- 左键点击：跳转到指定网址
- 按住左键可拖拽
- 右键单击：退出程序
- 每 8 秒在奶龙头顶弹出可爱提示（显示 5 秒，隐藏 3 秒）

首次运行会自动从 221.png 去除纯色背景，生成 milk_dragon.png。
"""

import os
import sys
import random
import webbrowser
from pathlib import Path

from PIL import Image
from PyQt5.QtCore import Qt, QTimer
from PyQt5.QtGui import QPixmap
from PyQt5.QtWidgets import QApplication, QWidget, QLabel

# ---------- 路径与配置 ----------
APP_DIR = Path(__file__).resolve().parent
RAW_IMAGE = APP_DIR / "221.png"
PROCESSED_IMAGE = APP_DIR / "milk_dragon.png"
URL = "http://localhost:5173/"

# 可爱提示语（每条都拆成两行，气泡高度统一）
MESSAGES = [
    "工作太久啦，\n起来活动活动身体吧～",
    "记得喝杯水哦，\n奶龙也要咕噜咕噜～",
    "奶龙想你了，\n看我一眼嘛！",
    "今天也要\n元气满满鸭！",
    "看看窗外吧，\n让眼睛休息一下",
    "肩膀有点僵？\n转一转脖子吧",
    "深呼吸三次，\n奶龙陪你放松一下",
    "你已经很棒啦，\n不要太累哦",
    "起来走两步，\n奶龙给你加油！",
    "伸个懒腰吧，\n继续冲鸭～",
]


# ---------- 背景去除 ----------
def process_image() -> Path:
    """读取 221.png，用从四角开始的泛洪填充挖掉连片背景，输出 milk_dragon.png。

    适用于天空/草地等多色背景，但奶龙本体颜色与背景差异较大的情况。
    """
    if PROCESSED_IMAGE.exists():
        return PROCESSED_IMAGE

    import numpy as np

    img = Image.open(RAW_IMAGE).convert("RGBA")
    arr = np.array(img)
    h, w = arr.shape[:2]

    visited = np.zeros((h, w), dtype=bool)
    threshold = 60  # 颜色最大通道差阈值（Chebyshev 距离）

    # 「魔棒」式泛洪：每个角点用自身颜色作为种子，扩散到颜色相近的连通区域
    def flood(sx, sy):
        seed = arr[sy, sx, :3].astype(np.int32)
        stack = [(sx, sy)]
        visited[sy, sx] = True
        arr[sy, sx] = (0, 0, 0, 0)
        while stack:
            x, y = stack.pop()
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and not visited[ny, nx]:
                    c = arr[ny, nx, :3].astype(np.int32)
                    d = int(max(abs(c[0] - seed[0]), abs(c[1] - seed[1]), abs(c[2] - seed[2])))
                    if d <= threshold:
                        visited[ny, nx] = True
                        arr[ny, nx] = (0, 0, 0, 0)
                        stack.append((nx, ny))

    # 四个角各自作为种子，兼顾天空和草地不同色域
    for sx, sy in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        if not visited[sy, sx]:
            flood(sx, sy)

    # 边缘抗锯齿：在阈值 ~ 2*threshold 之间的像素做半透明过渡
    soft_threshold = threshold * 2
    for y in range(h):
        for x in range(w):
            r, g, b, a = arr[y, x]
            if a == 0:
                continue
            # 找最近已移除的像素距离（粗略：看 4 邻域）
            min_d = None
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h and visited[ny, nx]:
                    nr, ng, nb, _ = arr[ny, nx]
                    d = abs(int(r) - int(nr)) + abs(int(g) - int(ng)) + abs(int(b) - int(nb))
                    if min_d is None or d < min_d:
                        min_d = d
            if min_d is not None and min_d < soft_threshold:
                alpha = int(255 * min_d / soft_threshold)
                arr[y, x] = (r, g, b, min(alpha, 255))

    Image.fromarray(arr, mode="RGBA").save(PROCESSED_IMAGE)
    return PROCESSED_IMAGE


# ---------- 气泡 ----------
class SpeechBubble(QLabel):
    """奶龙头顶的小气泡，作为桌宠的子控件，与桌宠一起拖动。"""

    def __init__(self, parent=None):
        super().__init__(parent)
        # 不再设置窗口标志，作为桌宠的子控件存在
        self.setAttribute(Qt.WA_TransparentForMouseEvents)
        self.setStyleSheet(
            "QLabel {"
            " background-color: #ffffff;"
            " color: #e6a800;"
            " border: 3px solid #ffc107;"
            " border-radius: 18px;"
            " padding: 14px 22px;"
            " font-family: 'Microsoft YaHei';"
            " font-size: 42px;"
            " font-weight: bold;"
            " line-height: 1.2;"
            "}"
        )
        self.setWordWrap(True)
        self.setAlignment(Qt.AlignCenter)
        self.setFixedWidth(460)
        self.hide()


# ---------- 桌宠主体 ----------
class MilkDragonPet(QWidget):
    BUBBLE_GAP = 14  # 气泡和图标之间的间距

    def __init__(self, pixmap: QPixmap):
        super().__init__()
        # 缩小到 70% 让桌宠更精致
        self._pixmap = pixmap.scaled(
            int(pixmap.width() * 0.7),
            int(pixmap.height() * 0.7),
            Qt.KeepAspectRatio,
            Qt.SmoothTransformation,
        )
        self._drag_offset = None
        self._press_pos = None

        self.setWindowFlags(
            Qt.FramelessWindowHint
            | Qt.Tool
            | Qt.WindowStaysOnTopHint
        )
        self.setAttribute(Qt.WA_TranslucentBackground)

        # 图标用子 QLabel 显示，方便和气泡一起布局
        self._image_label = QLabel(self)
        self._image_label.setPixmap(self._pixmap)
        self._image_label.setAttribute(Qt.WA_TransparentForMouseEvents)
        self._image_label.setStyleSheet("background: transparent;")

        # 气泡也是子控件（不是独立窗口），与桌宠一起拖动
        self.bubble = SpeechBubble(self)

        # 初始尺寸 = 只有图标，气泡隐藏
        pw, ph = self._pixmap.width(), self._pixmap.height()
        self.resize(pw, ph)
        self._image_label.move(0, 0)
        self._image_label.resize(pw, ph)

        # 默认放在屏幕右下角
        screen = QApplication.primaryScreen().availableGeometry()
        self.move(
            screen.right() - self.width() - 20,
            screen.bottom() - self.height() - 20,
        )

        # 启动 1.5 秒后第一次显示，之后每 8 秒一次
        QTimer.singleShot(1500, self._show_bubble)
        self._bubble_timer = QTimer(self)
        self._bubble_timer.timeout.connect(self._show_bubble)
        self._bubble_timer.start(8 * 1000)

    # ----- 鼠标交互（点击 / 拖拽整个组合）-----
    def mousePressEvent(self, event):
        if event.button() == Qt.LeftButton:
            self._drag_offset = event.globalPos() - self.frameGeometry().topLeft()
            self._press_pos = event.globalPos()
            event.accept()
        elif event.button() == Qt.RightButton:
            QApplication.quit()

    def mouseMoveEvent(self, event):
        if event.buttons() & Qt.LeftButton and self._drag_offset is not None:
            self.move(event.globalPos() - self._drag_offset)
            event.accept()

    def mouseReleaseEvent(self, event):
        if event.button() == Qt.LeftButton:
            if self._press_pos is not None:
                moved = (event.globalPos() - self._press_pos).manhattanLength()
                if moved < 5:  # 没怎么移动，视为点击
                    webbrowser.open(URL)
            self._drag_offset = None
            self._press_pos = None

    # ----- 气泡显隐 + 整体布局自适应 -----
    def _show_bubble(self):
        self.bubble.setText(random.choice(MESSAGES))
        self.bubble.adjustSize()
        self.bubble.show()
        self._relayout()
        # 5 秒后隐藏
        QTimer.singleShot(5 * 1000, self._hide_bubble)

    def _hide_bubble(self):
        self.bubble.hide()
        self._relayout()

    def _relayout(self):
        """根据气泡是否显示，重新计算 widget 尺寸并摆放子控件。

        保持水平中心和底边位置不变，气泡出现时整体向上生长。
        """
        pw, ph = self._pixmap.width(), self._pixmap.height()
        gap = self.BUBBLE_GAP

        if self.bubble.isVisible():
            bw = self.bubble.width()
            bh = self.bubble.height()
            total_w = max(bw, pw)
            total_h = bh + gap + ph
            bubble_x = (total_w - bw) // 2
            image_x = (total_w - pw) // 2
            image_y = bh + gap
        else:
            total_w = pw
            total_h = ph
            bubble_x = 0
            image_x = 0
            image_y = 0

        # 以底边和水平中心为锚点，气泡出现时只向上扩展
        anchor_center_x = self.x() + self.width() // 2
        anchor_bottom = self.y() + self.height()

        self.resize(total_w, total_h)
        self.bubble.move(bubble_x, 0)
        self._image_label.move(image_x, image_y)
        self._image_label.resize(pw, ph)

        self.move(anchor_center_x - total_w // 2, anchor_bottom - total_h)


# ---------- 入口 ----------
def main():
    if not RAW_IMAGE.exists():
        sys.exit(f"找不到原图: {RAW_IMAGE}")

    processed = process_image()
    app = QApplication(sys.argv)

    pixmap = QPixmap(str(processed))
    if pixmap.isNull():
        sys.exit(f"无法加载处理后的图片: {processed}")

    pet = MilkDragonPet(pixmap)
    pet.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
