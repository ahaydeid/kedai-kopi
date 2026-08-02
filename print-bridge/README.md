# Local Print Bridge - RPP02N 58mm Thermal Printer

Service backend lokal yang menghubungkan Web POS Kedai Kopi (Next.js 16) langsung ke printer thermal RPP02N melalui perangkat serial Linux `/dev/rfcomm0` (Bluetooth SPP) tanpa dialog pencetakan browser (**1-Click Direct Print**).

## Fitur Utama
1. **0-Click Instant Printing**: Klik tombol "Cetak Struk", struk langsung keluar dari RPP02N secara fisik.
2. **CORS & Private Network Access (PNA) Support**: Siap bekerja mulus baik saat aplikasi berjalan di Localhost (`http://localhost:3000`) maupun saat Production Cloud HTTPS (`https://domain-kedai.com`).
3. **Format ESC/POS Native 58mm**: Pengaturan tata letak teks otomatis 32 karakter per baris (Header, No. Pesanan, Daftar Item, Total, dan Cut Kertas).

## Cara Menjalankan Manual (Development)
```bash
cd print-bridge
node server.js
```

Sistem akan berjalan pada port `5000` (`http://127.0.0.1:5000`).

## Cara Memasang Service Otomatis saat Booting (Production)
```bash
# 1. Berikan izin eksekusi script bind
chmod +x print-bridge/rfcomm-bind.sh

# 2. Salin file systemd service
sudo cp print-bridge/rpp02n-bridge.service /etc/systemd/system/

# 3. Reload daemon & aktifkan service
sudo systemctl daemon-reload
sudo systemctl enable rpp02n-bridge
sudo systemctl start rpp02n-bridge

# 4. Cek status service
sudo systemctl status rpp02n-bridge
```

## Testing Status
```bash
curl http://127.0.0.1:5000/api/status
```
Respons:
```json
{
  "status": "online",
  "device": "/dev/rfcomm0",
  "ready": true,
  "printer": "RPP02N Thermal Printer 58mm"
}
```
