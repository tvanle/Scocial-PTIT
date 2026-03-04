# Hướng dẫn setup PTIT Social

## Yêu cầu

- **Node.js** 18+ (khuyến nghị 20 LTS)
- **Docker Desktop** (cho PostgreSQL và Redis)
- **npm** hoặc yarn

---

## 1. Khởi động Database (PostgreSQL + Redis)

Mở Docker Desktop, sau đó chạy:

```bash
cd backend
docker-compose up -d postgres redis
```

Kiểm tra container đang chạy:

```bash
docker-compose ps
```

- PostgreSQL: `localhost:5434`, user/pass: `postgres/postgres`, database: `ptit_social`
- Redis: `localhost:6381`

**Lỗi Docker credentials (macOS):** Nếu gặp `error getting credentials`, thử:
- Đăng nhập lại Docker Desktop hoặc xóa credential trong Keychain Access (tìm "Docker").
- Chạy: `docker logout` rồi mở lại Docker Desktop.

---

## 2. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

API chạy tại: **http://localhost:3001**

- Prisma Studio (xem DB): `npx prisma studio`

---

## 3. Mobile App (Expo)

```bash
# Từ thư mục gốc dự án
npm install
npm start
```

Sau đó:
- **iOS:** nhấn `i` trong terminal hoặc `npm run ios`
- **Android:** nhấn `a` hoặc `npm run android`
- **Web:** nhấn `w` hoặc `npm run web`

### Cấu hình API cho app

File `src/.env`:

- **Simulator/emulator:** `EXPO_PUBLIC_API_URL=http://localhost:3001/`
- **Thiết bị thật:** đổi thành IP máy tính trong mạng (vd: `http://192.168.1.100:3001/`), đảm bảo máy và điện thoại cùng WiFi.

Sau khi sửa `.env` cần restart Expo (`npm start` lại).

---

## 4. Chạy nhanh (tóm tắt)

**Terminal 1 – Database:**
```bash
cd backend && docker-compose up -d postgres redis
```

**Terminal 2 – Backend:**
```bash
cd backend && npm run dev
```

**Terminal 3 – Mobile:**
```bash
npm start
```

---

## Biến môi trường quan trọng

### Backend (`backend/.env`)

| Biến | Mô tả |
|------|--------|
| `DATABASE_URL` | PostgreSQL (mặc định port 5434) |
| `REDIS_URL` | Redis (mặc định port 6381) |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Bắt buộc đổi trong production |
| `SMTP_*` | Gmail/ SMTP nếu bật gửi email (verify, reset password) |

### Mobile (`src/.env`)

| Biến | Mô tả |
|------|--------|
| `EXPO_PUBLIC_API_URL` | URL backend (localhost hoặc IP máy khi dùng thiết bị thật) |

---

## Xử lý lỗi thường gặp

- **Can't reach database server at localhost:5434**  
  → Chạy Docker: `cd backend && docker-compose up -d postgres redis`

- **Redis connection refused**  
  → Redis chưa chạy; khởi động lại bằng docker-compose như trên.

- **App không gọi được API khi chạy trên máy thật**  
  → Đổi `EXPO_PUBLIC_API_URL` trong `src/.env` thành IP máy (vd: `http://192.168.x.x:3001/`), restart Expo.

- **Docker credential error (macOS)**  
  → Kiểm tra Docker Desktop đã đăng nhập; thử `docker logout` rồi đăng nhập lại.
