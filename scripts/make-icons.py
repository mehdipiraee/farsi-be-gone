"""Generate simple PNG icons (no dependencies): blue rounded square with a white 'no' sign."""
import math, struct, zlib, sys

def png(size):
    rows = []
    c = (size - 1) / 2
    r_sq = size * 0.2
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            # rounded square mask (supersampled edge via simple distance)
            dx = max(abs(x - c) - (size / 2 - r_sq), 0)
            dy = max(abs(y - c) - (size / 2 - r_sq), 0)
            inside = math.hypot(dx, dy) <= r_sq
            if not inside:
                row += bytes([0, 0, 0, 0]); continue
            col = (14, 90, 168, 255)
            d = math.hypot(x - c, y - c)
            ring = size * 0.30 <= d <= size * 0.40
            # slash from top-left to bottom-right inside ring
            dist_line = abs((x - c) - (y - c)) / math.sqrt(2)
            slash = dist_line <= size * 0.05 and d <= size * 0.40
            if ring or slash:
                col = (255, 255, 255, 255)
            row += bytes(col)
        rows.append(bytes(row))
    raw = b"".join(rows)
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))

for s in (16, 32, 48, 128):
    open(f"icons/icon{s}.png", "wb").write(png(s))
