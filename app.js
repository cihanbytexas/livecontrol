// Supabase Yapılandırması
const SUPABASE_URL = 'https://ubhixsmtpgvixgsnquzy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaGl4c210cGd2aXhnc25xdXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMTM1MDcsImV4cCI6MjEwMzY4OTUwN30.UBgRfCbOODlA9Dx6P9fIev7jIC8vHkLwdRs668EEEdU';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const container = document.getElementById('devices-container');

let devicesData = [];
const mapInstances = {}; // Harita, marker ve daireleri hafızada tutar

function formatTimeAgo(dateString) {
    if (!dateString) return 'Bilinmiyor';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'birkaç saniye önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dakika önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    return `${Math.floor(diffInSeconds / 86400)} gün önce`;
}

function checkOnlineStatus(sonGorulme) {
    if (!sonGorulme) return false;
    const date = new Date(sonGorulme);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    return diffInSeconds <= 120; // 2 dakika
}

// 1. Cihaz Kartı HTML Yapısı (Sıfırdan çizerken kullanılır)
function generateDeviceHTML(device) {
    const isOnline = checkOnlineStatus(device.son_gorulme);
    const statusClass = isOnline ? 'status-online' : 'status-offline';
    const statusIcon = isOnline ? '🟢' : '🔴';
    const statusText = isOnline ? 'Çevrimiçi' : 'Çevrimdışı';

    const hasLoc = device.son_enlem != null && device.son_boylam != null;

    return `
        <div class="device-card" id="device-${device.id}">
            <div class="device-header">
                <div class="device-title">${device.cihaz_adi || 'İsimsiz Cihaz'}</div>
                <div class="device-subtitle">${device.uretici} ${device.model} (Android ${device.android_surumu})</div>
            </div>
            
            <div id="status-badge-${device.id}" class="status-badge ${statusClass}">
                ${statusIcon} ${statusText}
            </div>

            <div class="device-details">
                <div class="detail-item">
                    <span>🔋</span> <span id="det-pil-${device.id}">Pil: ${device.pil_yuzdesi != null ? `%${device.pil_yuzdesi}` : '-'}</span>
                </div>
                <div class="detail-item">
                    <span>🔌</span> <span id="det-sarj-${device.id}">Şarj: ${device.sarj_oluyor ? 'Evet' : 'Hayır'}</span>
                </div>
                <div class="detail-item">
                    <span>📶</span> <span id="det-ag-${device.id}">Ağ: ${device.ag_tipi || '-'}</span>
                </div>
                <div class="detail-item">
                    <span>🌡️</span> <span id="det-sicaklik-${device.id}">Sıc: ${device.pil_sicakligi != null ? `${device.pil_sicakligi}°C` : '-'}</span>
                </div>
            </div>

            <!-- Harita Alanı -->
            <div id="map-${device.id}" class="map-container">
                ${!hasLoc ? '📍 Henüz konum alınamadı' : ''}
            </div>

            <!-- Konum Bilgileri -->
            <div class="location-details">
                <div><span>Enlem</span> <strong id="loc-lat-${device.id}">${hasLoc ? device.son_enlem.toFixed(6) : '-'}</strong></div>
                <div><span>Boylam</span> <strong id="loc-lng-${device.id}">${hasLoc ? device.son_boylam.toFixed(6) : '-'}</strong></div>
                <div><span>GPS Doğruluğu</span> <strong id="loc-acc-${device.id}">${device.son_konum_dogrulugu ? `±${device.son_konum_dogrulugu.toFixed(1)} m` : '-'}</strong></div>
                <div><span>Konum Güncelleme</span> <strong id="loc-time-${device.id}">${formatTimeAgo(device.guncellenme_tarihi)}</strong></div>
            </div>

            <div class="footer-info">
                <div id="footer-seen-${device.id}">🕐 Son görülme: ${formatTimeAgo(device.son_gorulme)}</div>
                <div id="footer-update-${device.id}">🔄 Son iletişim: ${formatTimeAgo(device.guncellenme_tarihi)}</div>
                <div>App: v${device.uygulama_surumu}</div>
            </div>
        </div>
    `;
}

// 2. Haritayı İlk Kez Oluşturma
function initMap(device) {
    if (device.son_enlem == null || device.son_boylam == null) return;
    
    const mapId = `map-${device.id}`;
    const mapEl = document.getElementById(mapId);
    if (!mapEl) return;

    mapEl.innerHTML = ''; // İçindeki "Henüz konum alınamadı" yazısını sil

    const map = L.map(mapId).setView([device.son_enlem, device.son_boylam], 16);
    
    // Koyu Tema Harita Katmanı (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const marker = L.marker([device.son_enlem, device.son_boylam]).addTo(map);
    marker.bindPopup(`<b>${device.cihaz_adi || 'Cihaz'}</b>`);

    let circle = null;
    if (device.son_konum_dogrulugu) {
        circle = L.circle([device.son_enlem, device.son_boylam], {
            radius: device.son_konum_dogrulugu,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            weight: 2
        }).addTo(map);
    }

    mapInstances[device.id] = { map, marker, circle, isCentered: true };
}

// 3. Mevcut Arayüzü ve Harita Marker'ını Güncelleme (Sayfa Sıfırlanmaz)
function updateDeviceDOM(device) {
    const card = document.getElementById(`device-${device.id}`);
    if (!card) {
        renderDevices(); // Kart yoksa tam render yap
        return;
    }

    // Durum rozeti
    const isOnline = checkOnlineStatus(device.son_gorulme);
    const badge = document.getElementById(`status-badge-${device.id}`);
    if (badge) {
        badge.className = `status-badge ${isOnline ? 'status-online' : 'status-offline'}`;
        badge.innerHTML = `${isOnline ? '🟢' : '🔴'} ${isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}`;
    }

    // Temel Bilgiler
    document.getElementById(`det-pil-${device.id}`).innerText = `Pil: ${device.pil_yuzdesi != null ? `%${device.pil_yuzdesi}` : '-'}`;
    document.getElementById(`det-sarj-${device.id}`).innerText = `Şarj: ${device.sarj_oluyor ? 'Evet' : 'Hayır'}`;
    document.getElementById(`det-ag-${device.id}`).innerText = `Ağ: ${device.ag_tipi || '-'}`;
    document.getElementById(`det-sicaklik-${device.id}`).innerText = `Sıc: ${device.pil_sicakligi != null ? `${device.pil_sicakligi}°C` : '-'}`;

    // Konum Bilgileri
    const hasLoc = device.son_enlem != null && device.son_boylam != null;
    document.getElementById(`loc-lat-${device.id}`).innerText = hasLoc ? device.son_enlem.toFixed(6) : '-';
    document.getElementById(`loc-lng-${device.id}`).innerText = hasLoc ? device.son_boylam.toFixed(6) : '-';
    document.getElementById(`loc-acc-${device.id}`).innerText = device.son_konum_dogrulugu ? `±${device.son_konum_dogrulugu.toFixed(1)} m` : '-';
    
    // Alt Bilgiler
    document.getElementById(`loc-time-${device.id}`).innerText = formatTimeAgo(device.guncellenme_tarihi);
    document.getElementById(`footer-seen-${device.id}`).innerText = `🕐 Son görülme: ${formatTimeAgo(device.son_gorulme)}`;
    document.getElementById(`footer-update-${device.id}`).innerText = `🔄 Son iletişim: ${formatTimeAgo(device.guncellenme_tarihi)}`;

    // Harita Marker Güncellemesi
    if (hasLoc) {
        if (!mapInstances[device.id]) {
            // Harita daha önce yüklenmediyse (Cihaz yeni konum gönderdiyse) başlat
            initMap(device);
        } else {
            // Harita varsa sadece yeri değiştir (Haritayı sürekli merkeze sabitlemez)
            const { marker, circle } = mapInstances[device.id];
            const newLatLng = [device.son_enlem, device.son_boylam];
            
            marker.setLatLng(newLatLng);
            if (circle) {
                circle.setLatLng(newLatLng);
                if (device.son_konum_dogrulugu) {
                    circle.setRadius(device.son_konum_dogrulugu);
                }
            }
        }
    }
}

// 4. Tüm Kartları En Baştan Render Etme (İlk Yükleme ve Insert/Delete için)
function renderDevices() {
    if (devicesData.length === 0) {
        container.innerHTML = '<p class="loading">Henüz cihaz bulunmuyor.</p>';
        return;
    }

    // Eski harita verilerini bellekten temizle
    Object.keys(mapInstances).forEach(id => {
        if (mapInstances[id] && mapInstances[id].map) {
            mapInstances[id].map.remove();
        }
        delete mapInstances[id];
    });

    container.innerHTML = devicesData.map(device => generateDeviceHTML(device)).join('');
    
    // DOM oluştuktan 100ms sonra haritaları çiz (Gri ekran hatasını engeller)
    setTimeout(() => {
        devicesData.forEach(device => initMap(device));
    }, 100);
}

// Sadece sayfadaki "... saniye önce" ibarelerini güncelleyen performanslı döngü
function updateAllTimeStrings() {
    devicesData.forEach(device => {
        const locTime = document.getElementById(`loc-time-${device.id}`);
        const seenTime = document.getElementById(`footer-seen-${device.id}`);
        const updateTime = document.getElementById(`footer-update-${device.id}`);
        
        if (locTime) locTime.innerText = formatTimeAgo(device.guncellenme_tarihi);
        if (seenTime) seenTime.innerText = `🕐 Son görülme: ${formatTimeAgo(device.son_gorulme)}`;
        if (updateTime) updateTime.innerText = `🔄 Son iletişim: ${formatTimeAgo(device.guncellenme_tarihi)}`;
        
        const isOnline = checkOnlineStatus(device.son_gorulme);
        const badge = document.getElementById(`status-badge-${device.id}`);
        if (badge) {
            badge.className = `status-badge ${isOnline ? 'status-online' : 'status-offline'}`;
            badge.innerHTML = `${isOnline ? '🟢' : '🔴'} ${isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}`;
        }
    });
}

// İlk verileri çek
async function fetchDevices() {
    const { data, error } = await client
        .from('cihazlar')
        .select('*')
        .order('son_gorulme', { ascending: false });

    if (error) {
        console.error('Veri çekme hatası:', error);
        container.innerHTML = '<p class="loading">Veriler yüklenirken bağlantı hatası oluştu.</p>';
        return;
    }

    devicesData = data || [];
    renderDevices();
}

// Supabase Realtime 
function setupRealtime() {
    client
        .channel('public:cihazlar')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cihazlar' }, payload => {
            if (payload.eventType === 'INSERT') {
                devicesData.unshift(payload.new);
                renderDevices();
            } else if (payload.eventType === 'UPDATE') {
                const index = devicesData.findIndex(d => d.id === payload.new.id);
                if (index !== -1) {
                    devicesData[index] = payload.new;
                    updateDeviceDOM(payload.new); // Paneli sıfırlamadan sadece değerleri günceller
                } else {
                    devicesData.push(payload.new);
                    renderDevices();
                }
            } else if (payload.eventType === 'DELETE') {
                devicesData = devicesData.filter(d => d.id !== payload.old.id);
                renderDevices();
            }
        })
        .subscribe();
}

// Zaman damgalarını her 15 saniyede bir paneli yormadan günceller
setInterval(updateAllTimeStrings, 15000);

// Sistemi başlat
fetchDevices();
setupRealtime();
