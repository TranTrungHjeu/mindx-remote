# Hướng dẫn chi tiết chạy API Node.js tự động hóa xử lý Ticket

Ứng dụng Node.js này đóng vai trò là API nhận Webhook (`POST /webhook/odoo`) trực tiếp từ Odoo để tự động hóa xử lý Ticket.

## Các tính năng chính

1. **Webhook Receiver API:** Endpoint lắng nghe sự kiện từ Odoo gửi sang.
2. **NLP Pattern Matching:** Nhận diện ticket liên quan đến sự cố đăng nhập/khoá tài khoản.
3. **Mock HR Integration:** Tra cứu trạng thái nhân sự (Active/Terminated).
4. **Decision Logic & Actions:**
   - Nhân viên đang làm việc (Active) -> Tự động kích hoạt tài khoản LMS + Gửi email thông báo + Đóng Ticket trên Odoo thành 'Resolved'.
   - Nhân viên đã nghỉ việc (Terminated) -> Chuyển ticket về hàng chờ 'Pending IT Review' + Viết log cảnh báo.

---

## 1. Cách khởi chạy API Server

1. Cài đặt các thư viện cần thiết:

   ```bash
   npm install
   ```

2. Khởi chạy server:
   ```bash
   node server.js
   ```

Server sẽ chạy ở cổng 3000:

```
http://localhost:3000/webhook/odoo
```

---

## 2. Hướng dẫn Test API chi tiết bằng `curl`

Mở một terminal mới (trong khi server đang chạy) và copy các câu lệnh dưới đây để giả lập sự kiện Webhook gửi từ Odoo:

### Case 1: Nhân sự đang làm việc (Active) -> Tự động xử lý và giải quyết ticket

```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "id": "1001",
  "subject": "Không đăng nhập được LMS",
  "description": "Hệ thống báo tài khoản của tôi đang bị vô hiệu hoá.",
  "email": "john.doe@example.com"
}' http://localhost:3000/webhook/odoo
```

_Kết quả server logs:_ Sẽ tự động kích hoạt tài khoản, gửi email phản hồi, cập nhật Odoo thành `Resolved`.

### Case 2: Nhân sự đã nghỉ việc (Terminated) -> Từ chối tự động, gắn cờ cảnh báo IT

```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "id": "1002",
  "subject": "Yêu cầu Reset mật khẩu",
  "description": "Vui lòng cấp lại mật khẩu đăng nhập LMS.",
  "email": "jane.smith@example.com"
}' http://localhost:3000/webhook/odoo
```

_Kết quả server logs:_ Phát hiện nhân sự nghỉ việc, ghi chú private note cảnh báo và đẩy trạng thái ticket thành `Pending IT Review`.

### Case 3: Ticket không liên quan đến đăng nhập -> Bỏ qua

```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "id": "1003",
  "subject": "Xin cấp chuột máy tính mới",
  "description": "Chuột của tôi bị hỏng con lăn.",
  "email": "alex.wong@example.com"
}' http://localhost:3000/webhook/odoo
```

_Kết quả server logs:_ Báo lỗi không khớp bộ lọc NLP và dừng xử lý để IT tự check thủ công.
