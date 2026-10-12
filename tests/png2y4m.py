# PNG 한 장을 640x480 회색조 y4m 영상(30프레임)으로 만든다 — Chrome 가짜 카메라 입력용
import sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
W, H = 640, 480
img = Image.open(src).convert("L")
img.thumbnail((int(W * 0.9), int(H * 0.8)))
canvas = Image.new("L", (W, H), 235)
canvas.paste(img, ((W - img.width) // 2, (H - img.height) // 2))
y = canvas.tobytes()
uv = bytes([128]) * (W * H // 4)
with open(dst, "wb") as f:
    f.write(f"YUV4MPEG2 W{W} H{H} F10:1 Ip A1:1 C420jpeg\n".encode())
    for _ in range(30):
        f.write(b"FRAME\n" + y + uv + uv)
