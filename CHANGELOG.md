# Changelog

Theo [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) và [Semantic Versioning](https://semver.org/). Các bản 0.x là Preview; thay đổi hành vi được ghi rõ.

## [Unreleased]

## [0.1.0] - 2026-10-04

### Added

- Lập danh sách theo ngày, bắt đầu/chuyển việc, tạm nghỉ và hoàn thành.
- Cửa sổ nổi với thời gian, kéo thả, ẩn/khôi phục, chống đóng nhầm và Ctrl+Shift+F.
- Break Mode theo thiết kế FocusFlow, nghỉ 5 phút và pause/resume.
- Dữ liệu cục bộ, lịch sử nội bộ 90 ngày, sao lưu file không đọc được và autostart.
- Gói Debian amd64, SHA-256, kiểm thử state/desktop và GitHub Actions release.
- README, hướng dẫn phát triển/release, đóng góp, bảo mật và giấy phép tài sản.

### Known limitations

- **Preview:** chưa chứng nhận cài đặt/hành vi native trên Ubuntu thật. GUI tests chạy trên cloud với sandbox tắt riêng cho lần chạy thử.
- Chưa có đồng bộ, màn hình lịch sử, chuyển việc chưa làm sang ngày mới, tùy chỉnh nghỉ hoặc cập nhật tự động.
- Always-on-top tùy thuộc window manager; notification/tray tùy thuộc desktop.
- Kết hợp tiếng Việt/Anh, chưa có tùy chọn ngôn ngữ. Gói `.deb` chưa ký số.

[Unreleased]: https://github.com/khuebt/reminder-app/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/khuebt/reminder-app/releases/tag/v0.1.0
