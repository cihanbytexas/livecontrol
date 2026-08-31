// Supabase Yapılandırması
const SUPABASE_URL = 'https://ubhixsmtpgvixgsnquzy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaGl4c210cGd2aXhnc25xdXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMTM1MDcsImV4cCI6MjEwMzY4OTUwN30.UBgRfCbOODlA9Dx6P9fIev7jIC8vHkLwdRs668EEEdU';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const container = document.getElementById('devices-container');
const modal = document.getElementById('notifications-modal');
const modalList = document.getElementById('modal-notifications-list');

let devicesData = [];
const mapInstances = {}; 

function formatTimeAgo(dateString) {
    if (!dateString) return 'Bilinmiyor';
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'az önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dk önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    return `${Math.floor(diffInSeconds / 86400)} gün önce`;
}

function checkOnlineStatus(sonGorulme) {
    if (!sonGorulme) return false;
    const diffInSeconds = Math.floor((new Date() - new Date(sonGorulme)) / 1000);
    return diffInSeconds <= 120; // 2 Dakika
}

// Cihaz Kartı HTML Üretici
function generateDeviceHTML(device) {
    const isOnline = checkOnlineStatus(device.son_gorulme);
    const statusClass = isOnline ? 'status-online' : 'status-offline';
    const statusText = isOnline ? 'Çevrimiçi' : 'Çevrimdışı';
    const hasLoc = device.son_enlem != null && device.son_boylam != null;

    return `
        <div class="device-card" id="device-${device.id}">
            <div class="device-header">
                <div class="device-title-wrapper">
                    <div class="device-title">${device.cihaz_adi || 'İsimsiz Cihaz'}</div>
                    <div class="device-subtitle">${device.uretici} ${device.model} • Android ${device.android_surumu}</div>
                </div>
                <div id="status-badge-${device.id}" class="status-badge ${statusClass}">
                    ${statusText}
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-box">
                    <span class="stat-icon">🔋</span>
                    <div class="stat-info">
                        <span class="stat-label">Pil Durumu</span>
                        <span class="stat-value" id="det-pil-${device.id}">${device.pil_yuzdesi != null ? `%${device.pil_yuzdesi}` : '-'} ${device.sarj_oluyor ? '⚡' : ''}</span>
                    </div>
                </div>
                <div class="stat-box">
                    <span class="stat-icon">📶</span>
                    <div class="stat-info">
                        <span class="stat-label">Ağ Bağlantısı</span>
                        <span class="stat-value" id="det-ag-${device.id}">${device.ag_tipi || '-'}</span>
                    </div>
                </div>
                <div class="stat-box">
                    <span class="stat-icon">📍</span>
                    <div class="stat-info">
                        <span class="stat-label">Konum Hata Payı</span>
                        <span class="stat-value" id="loc-acc-${device.id}">${device.son_konum_dogrulugu ? `±${device.son_konum_dogrulugu.toFixed(1)}m` : '-'}</span>
                    </div>
                </div>
                <div class="stat-box">
                    <span class="stat-icon">🔄</span>
                    <div class="stat-info">
                        <span class="stat-label">Son Güncelleme</span>
                        <span class="stat-value" id="loc-time-${device.id}">${formatTimeAgo(device.guncellenme_tarihi)}</span>
                    </div>
                </div>
            </div>

            <div id="map-${device.id}" class="map-container">
                ${!hasLoc ? 'Harita bilgisi bekleniyor...' : ''}
            </div>
            
            <div class="card-actions">
                <button class="btn" onclick="openNotifications('${device.id}')">
                    🔔 Bildirimleri Gör
                </button>
            </div>

            <div class="footer-info">
                <span id="footer-seen-${device.id}">Son görülme: ${formatTimeAgo(device.son_gorulme)}</span>
                <span>v${device.uygulama_surumu}</span>
            </div>
        </div>
    `;
}

// Harita Yükleme
function initMap(device) {
    if (device.son_enlem == null || device.son_boylam == null) return;
    const mapId = `map-${device.id}`;
    const mapEl = document.getElementById(mapId);
    if (!mapEl) return;
    mapEl.innerHTML = ''; 

    const map = L.map(mapId, { zoomControl: false }).setView([device.son_enlem, device.son_boylam], 16);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const marker = L.marker([device.son_enlem, device.son_boylam]).addTo(map);

    let circle = null;
    if (device.son_konum_dogrulugu) {
        circle = L.circle([device.son_enlem, device.son_boylam], {
            radius: device.son_konum_dogrulugu,
            color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2
        }).addTo(map);
    }
    mapInstances[device.id] = { map, marker, circle };
}

// DOM Diffing (Arayüz Güncelleme)
function updateDeviceDOM(device) {
    const card = document.getElementById(`device-${device.id}`);
    if (!card) return renderDevices(); 

    const isOnline = checkOnlineStatus(device.son_gorulme);
    const badge = document.getElementById(`status-badge-${device.id}`);
    if (badge) {
        badge.className = `status-badge ${isOnline ? 'status-online' : 'status-offline'}`;
        badge.innerText = isOnline ? 'Çevrimiçi' : 'Çevrimdışı';
    }

    document.getElementById(`det-pil-${device.id}`).innerText = `${device.pil_yuzdesi != null ? `%${device.pil_yuzdesi}` : '-'} ${device.sarj_oluyor ? '⚡' : ''}`;
    document.getElementById(`det-ag-${device.id}`).innerText = device.ag_tipi || '-';
    document.getElementById(`loc-acc-${device.id}`).innerText = device.son_konum_dogrulugu ? `±${device.son_konum_dogrulugu.toFixed(1)}m` : '-';
    document.getElementById(`loc-time-${device.id}`).innerText = formatTimeAgo(device.guncellenme_tarihi);
    document.getElementById(`footer-seen-${device.id}`).innerText = `Son görülme: ${formatTimeAgo(device.son_gorulme)}`;

    const hasLoc = device.son_enlem != null && device.son_boylam != null;
    if (hasLoc) {
        if (!mapInstances[device.id]) {
            initMap(device);
        } else {
            const { marker, circle } = mapInstances[device.id];
            const newLatLng = [device.son_enlem, device.son_boylam];
            marker.setLatLng(newLatLng);
            if (circle) {
                circle.setLatLng(newLatLng);
                if (device.son_konum_dogrulugu) circle.setRadius(device.son_konum_dogrulugu);
            }
        }
    }
}

// Tüm Kartları Render Etme
function renderDevices() {
    if (devicesData.length === 0) {
        container.innerHTML = `
            <div class="loading-state">
                <p>Henüz kayıtlı veya aktif cihaz bulunmuyor.</p>
            </div>`;
        return;
    }

    Object.keys(mapInstances).forEach(id => {
        if (mapInstances[id] && mapInstances[id].map) mapInstances[id].map.remove();
        delete mapInstances[id];
    });

    container.innerHTML = devicesData.map(device => generateDeviceHTML(device)).join('');
    setTimeout(() => devicesData.forEach(device => initMap(device)), 100);
}

// Bildirim Modal Mantığı
window.openNotifications = async function(deviceId) {
    modal.classList.add('active');
    modalList.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Bildirimler getiriliyor...</p></div>';

    const { data, error } = await client
        .from('bildirimler')
        .select('*')
        .eq('cihaz_id', deviceId)
        .order('olusturulma_tarihi', { ascending: false })
        .limit(30);

    if (error) {
        modalList.innerHTML = `<p style="color:var(--danger)">Hata oluştu: ${error.message}</p>`;
        return;
    }

    if (!data || data.length === 0) {
        modalList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px;">Bu cihaza ait bildirim bulunamadı.</p>';
        return;
    }

    modalList.innerHTML = data.map(notif => `
        <div class="notification-item">
            <div class="notif-app">
                <span>${notif.uygulama_adi || notif.paket_adi}</span>
                <span class="${notif.etiket === 'EKLENDI' ? 'notif-badge-added' : 'notif-badge-removed'}">${notif.etiket}</span>
            </div>
            <div class="notif-title">${notif.baslik || 'Başlıksız'}</div>
            <div class="notif-text">${notif.icerik || ''}</div>
            <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 8px;">${formatTimeAgo(notif.olusturulma_tarihi)}</div>
        </div>
    `).join('');
};

window.closeNotifications = function() {
    modal.classList.remove('active');
};

// Cihazları Çek ve Realtime Kur
async function fetchDevices() {
    const { data, error } = await client.from('cihazlar').select('*').order('son_gorulme', { ascending: false });
    if (!error) {
        devicesData = data || [];
        renderDevices();
    }
}

function setupRealtime() {
    client.channel('public:cihazlar')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cihazlar' }, payload => {
            if (payload.eventType === 'INSERT') {
                devicesData.unshift(payload.new); renderDevices();
            } else if (payload.eventType === 'UPDATE') {
                const index = devicesData.findIndex(d => d.id === payload.new.id);
                if (index !== -1) { devicesData[index] = payload.new; updateDeviceDOM(payload.new); } 
                else { devicesData.push(payload.new); renderDevices(); }
            } else if (payload.eventType === 'DELETE') {
                devicesData = devicesData.filter(d => d.id !== payload.old.id); renderDevices();
            }
        }).subscribe();
}

// Zaman damgalarını periyodik güncelle (Paneli Yormadan)
setInterval(() => {
    devicesData.forEach(device => {
        const locTime = document.getElementById(`loc-time-${device.id}`);
        const seenTime = document.getElementById(`footer-seen-${device.id}`);
        if (locTime) locTime.innerText = formatTimeAgo(device.guncellenme_tarihi);
        if (seenTime) seenTime.innerText = `Son görülme: ${formatTimeAgo(device.son_gorulme)}`;
        
        const isOnline = checkOnlineStatus(device.son_gorulme);
        const badge = document.getElementById(`status-badge-${device.id}`);
        if (badge) {
            badge.className = `status-badge ${isOnline ? 'status-online' : 'status-offline'}`;
            badge.innerText = isOnline ? 'Çevrimiçi' : 'Çevrimdışı';
        }
    });
}, 15000);

fetchDevices();
setupRealtime();
