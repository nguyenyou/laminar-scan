# Laminar Scan

## Lag Radar

The Lag Radar is an SVG-based visualization that displays frame timing performance in real-time. It works like a radar sweep, with each frame rendered as an arc segment.

### How It Works

1. **Radar Sweep Animation**: The radar hand rotates continuously using `requestAnimationFrame`. Each frame, it calculates the rotation delta based on elapsed time since the last frame.

2. **Arc Segments**: Each animation frame draws an arc segment from the previous hand position to the current position. The arc is stored in a circular buffer of configurable size (default: 50 frames).

3. **Color-Coded Performance**: Arc color is determined by frame duration using a logarithmic hue calculation:
   - **Green (hue ~120)**: Fast frames (~16ms, 60fps)
   - **Yellow (hue ~60)**: Moderate lag (~100ms)
   - **Red (hue ~0)**: Severe lag (approaching 1000ms)

4. **Fade Trail**: Older arc segments progressively fade out, creating a trailing effect that shows performance history over the last N frames.

### Visual Interpretation

- **Uniform green segments**: Smooth 60fps performance
- **Mixed colors with occasional yellow/red**: Intermittent frame drops or jank
- **Large red arcs**: Significant main thread blocking (long tasks, heavy computation)
- **Arc size**: Larger arcs indicate longer frame times; small uniform arcs indicate consistent frame pacing

---

## Lag Radar (Tiếng Việt)

Lag Radar là một công cụ trực quan hóa dựa trên SVG, hiển thị hiệu suất thời gian khung hình theo thời gian thực. Nó hoạt động như một radar quét, với mỗi khung hình được vẽ thành một cung tròn.

### Cách Hoạt Động

1. **Hoạt ảnh quét radar**: Kim radar quay liên tục sử dụng `requestAnimationFrame`. Mỗi khung hình, nó tính toán độ xoay dựa trên thời gian đã trôi qua kể từ khung hình trước.

2. **Các đoạn cung**: Mỗi khung hình hoạt ảnh vẽ một đoạn cung từ vị trí kim trước đó đến vị trí hiện tại. Cung được lưu trong bộ đệm vòng với kích thước có thể cấu hình (mặc định: 50 khung hình).

3. **Màu sắc theo hiệu suất**: Màu cung được xác định bởi thời gian khung hình sử dụng tính toán hue logarit:
   - **Xanh lá (hue ~120)**: Khung hình nhanh (~16ms, 60fps)
   - **Vàng (hue ~60)**: Độ trễ trung bình (~100ms)
   - **Đỏ (hue ~0)**: Độ trễ nghiêm trọng (gần 1000ms)

4. **Vệt mờ dần**: Các đoạn cung cũ hơn dần dần mờ đi, tạo hiệu ứng vệt hiển thị lịch sử hiệu suất qua N khung hình gần nhất.

### Cách Đọc Hiển Thị

- **Các đoạn xanh lá đồng đều**: Hiệu suất mượt mà 60fps
- **Màu sắc hỗn hợp với vàng/đỏ thỉnh thoảng**: Rớt khung hình hoặc giật lag không thường xuyên
- **Cung đỏ lớn**: Main thread bị chặn đáng kể (tác vụ dài, tính toán nặng)
- **Kích thước cung**: Cung lớn hơn cho thấy thời gian khung hình dài hơn; cung nhỏ đồng đều cho thấy nhịp khung hình ổn định