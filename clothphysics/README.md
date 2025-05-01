# Cloth Simulation Project
## How to Use

1. Run the project on a web server (a local server is sufficient)
2. Open it in your browser

### Kontroller

- **Kamera Hareketi**: Fare ile sürükleyerek kamerayı döndürün, fare tekerleği ile yakınlaşıp uzaklaşın
- **Kumaş Etkileşimi**: Kumaşa tıklayıp sürükleyerek hareket ettirin
- **Rüzgar Efekti**: Boşluk tuşuna basarak rastgele rüzgar oluşturun
- **Sıfırlama**: R tuşuna basarak kumaşı orijinal konumuna getirin

## Teknik Detaylar

- Kumaş, 20x20 parçacık ızgarası olarak modellenmiştir
- Verlet entegrasyonu ile fizik hesaplamaları yapılır
- Kütle-yay sistemi ile kumaş davranışı simüle edilir
- Three.js ile 3D render işlemleri gerçekleştirilir

## Yerel Olarak Çalıştırma

Projeyi yerel olarak çalıştırmak için:

```bash
# Basit bir HTTP sunucusu başlatmak için (Python kullanarak)
python -m http.server

# Veya Node.js ile
npx http-server