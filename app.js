const SUPABASE_URL = 'https://ubhixsmtpgvixgsnquzy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaGl4c210cGd2aXhnc25xdXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMTM1MDcsImV4cCI6MjEwMzY4OTUwN30.UBgRfCbOODlA9Dx6P9fIev7jIC8vHkLwdRs668EEEdU';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const container = document.getElementById('devices-container');
const modal = document.getElementById('notifications-modal');
const modalList = document.getElementById('modal-notifications-list');
const modalFilters = document.getElementById('modal-filters');

let devicesData = [];
const mapInstances = {}; 
let currentNotifications = [];

// --- UYGULAMA LOGOLARI (SVG) ---
function getAppDetails(packageName, defaultName) {
    const pkg = packageName.toLowerCase();
    
    // ÖNEMLİ: Threads (barcelona) her zaman Instagram'dan önce kontrol edilmeli!
    const apps = [
        { keys: ['barcelona', 'threads'], name: 'Threads', color: '#000000', icon: '<path d="M14.15 14.86c-1.13.87-2.62 1.26-4.23 1.06-2.22-.27-4.11-1.9-4.64-4.08-.52-2.14.33-4.32 2.16-5.54 1.76-1.17 4.09-1.19 5.86-.04 1.52.98 2.37 2.65 2.3 4.48-.08 1.98-.83 3.86-2.12 5.35-1.18 1.35-2.68 2.3-4.35 2.75-.49.13-1 .2-1.51.22v-1.64c.4-.01.8-.06 1.2-.15 1.31-.3 2.5-1.03 3.42-2.03 1.05-1.15 1.66-2.68 1.72-4.27.05-1.4-.58-2.7-1.72-3.54-1.31-.97-3.12-1.05-4.51-.18-1.4.87-2.15 2.5-1.8 4.1.35 1.61 1.69 2.83 3.33 3.03 1.16.15 2.3-.11 3.2-.73l-1.29-1.52c-.46.33-1.04.53-1.62.55-1.3.06-2.46-.76-2.82-2.01-.38-1.29.29-2.68 1.55-3.24 1.27-.56 2.78-.13 3.52 1 .35.54.49 1.18.39 1.81l1.69.07c.14-.88-.06-1.8-.55-2.56-1-1.54-2.92-2.16-4.66-1.5-1.74.65-2.88 2.38-2.78 4.22.1 1.78 1.46 3.17 3.24 3.32.82.07 1.64-.15 2.34-.61l1.25 1.47z"/>' },
        { keys: ['instagram'], name: 'Instagram', color: '#E1306C', icon: '<path d="M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.15-3.23 1.66-4.77 4.92-4.92 1.27-.06 1.65-.07 4.85-.07zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zM12 16a4 4 0 110-8 4 4 0 010 8zm6.41-11.85a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/>' },
        { keys: ['whatsapp'], name: 'WhatsApp', color: '#25D366', icon: '<path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51a12.8 12.8 0 0 0-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35m-5.42 7.4h0a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h0c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41z"/>' },
        { keys: ['telegram'], name: 'Telegram', color: '#26A5E4', icon: '<path d="M11.94 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.06 0zm4.96 7.22c.1 0 .32.02.47.14a.51.51 0 0 1 .17.33c.01.09.03.3.02.47-.18 1.9-.96 6.5-1.36 8.63-.17.9-.5 1.2-.82 1.23-.7.06-1.22-.46-1.9-.9-1.06-.69-1.65-1.12-2.68-1.8-1.18-.77-.42-1.2.25-1.9.18-.18 3.24-2.96 3.3-3.21.01-.03.02-.15-.06-.22s-.18-.04-.26-.03c-.1.03-1.85 1.18-5.22 3.45-.49.34-.94.51-1.34.5-.44-.01-1.29-.25-1.92-.46-.78-.25-1.39-.39-1.34-.82.03-.22.33-.45.92-.69 3.59-1.56 5.99-2.59 7.18-3.09 3.41-1.43 4.12-1.68 4.58-1.69z"/>' },
        { keys: ['tiktok'], name: 'TikTok', color: '#000000', icon: '<path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v7.2c0 1.98-.77 3.93-2.19 5.37-1.37 1.4-3.32 2.22-5.3 2.24-1.99.02-3.95-.74-5.4-2.1-1.46-1.38-2.31-3.33-2.34-5.35-.03-2.02.8-3.99 2.23-5.39 1.44-1.4 3.4-2.18 5.4-2.17.43 0 .86.03 1.28.1v4.06c-.4-.05-.8-.06-1.2-.06-1.07.01-2.08.45-2.82 1.2-1.11 1.11-1.29 2.94-.43 4.24.77 1.17 2.16 1.77 3.55 1.48 1.34-.28 2.37-1.32 2.65-2.67.06-.3.09-.61.09-.92V.02z"/>' },
        { keys: ['facebook'], name: 'Facebook', color: '#1877F2', icon: '<path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/>' },
        { keys: ['youtube'], name: 'YouTube', color: '#FF0000', icon: '<path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM9.5 15.5v-7l6.5 3.5-6.5 3.5z"/>' },
        { keys: ['twitter', 'com.x'], name: 'X (Twitter)', color: '#000000', icon: '<path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24H16.17l-5.21-6.82L4.99 21.75H1.68l7.73-8.84L1.25 2.25H8.08l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z"/>' },
        { keys: ['messaging', 'mms', 'sms', 'message'], name: 'Mesajlar', color: '#1A73E8', icon: '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm8 0h2v2h-2zm-4 0h2v2h-2z"/>' },
        { keys: ['googlequicksearchbox', 'google', 'chrome'], name: 'Google', color: '#4285F4', icon: '<path d="M12.48 10.92v3.28h7.84c-.24 1.84-1.53 3.69-3.96 4.95-2.3 1.34-5.32 1.55-7.9.5-2.83-1.15-5.06-3.66-5.83-6.66-.23-.87-.33-1.78-.33-2.69s.1-1.83.33-2.69c.77-3 3-5.51 5.83-6.66 3.16-1.29 6.71-.85 9.4 1.15l-2.45 2.45c-1.58-1.1-3.69-1.52-5.71-1.02-2.31.57-4.24 2.27-5.11 4.46-.38.96-.58 1.99-.58 3.03s.2 2.07.58 3.03c.87 2.19 2.8 3.89 5.11 4.46 2.08.52 4.31.06 6.04-1.19.98-.71 1.63-1.73 1.9-2.89h-5.26z"/>' },
        { keys: ['vending', 'play.store'], name: 'Play Store', color: '#414141', icon: '<path d="M3.1 2.2C2.8 2.5 2.5 3 2.5 3.7v16.5c0 .7.3 1.2.6 1.5l.1.1 11.2-11.2v-.2L3.2 2.1l-.1.1zm11.7 11.6l-3.3-3.3-3.3 3.3 3.8 3.8c1.3 1.3 3.5 1.3 4.8 0l1.8-1.8-3.8-2zM15 13.6l3.8-2 1.8-1c1.3-.7 1.3-1.9 0-2.6l-1.8-1-3.8-2-4.1 4.1v.2l4.1 4.3z"/>' },
        { keys: ['systemui', 'android.system', 'settings'], name: 'Sistem', color: '#64748B', icon: '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84c-.24 0-.43.19-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.73 9.87a.49.49 0 00.12.61l2.03 1.58c-.05.3-.09.62-.09.94s.02.64.06.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.22.24.41.48.41h3.84c.24 0 .43-.19.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>' },
        { keys: ['dialer', 'incallui', 'contacts'], name: 'Telefon', color: '#10B981', icon: '<path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>' }
    ];

    for (let app of apps) { if (app.keys.some(k => pkg.includes(k))) return app; }

    // Eşleşme yoksa "Generic App" (Uygulama) ikonu
    return { 
        name: defaultName && !defaultName.includes('.') ? defaultName : (pkg.split('.').pop() || 'Uygulama'), 
        color: '#475569', 
        icon: '<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect>' 
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

// Tüm emojiler Feather UI ikonlarıyla değiştirildi
function generateDeviceHTML(device) {
    const isOnline = checkOnlineStatus(device.son_gorulme);
    const hasLoc = device.son_enlem != null && device.son_boylam != null;
    const isCharging = device.sarj_oluyor;

    // Pil ikonu hesaplaması (şarj oluyorsa içini doldur)
    const batterySVG = isCharging 
        ? `<svg class="stat-icon ui-icon" viewBox="0 0 24 24"><path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19M15 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.19"></path><line x1="23" y1="13" x2="23" y2="11"></line><polyline points="11 6 7 12 13 12 9 18"></polyline></svg>`
        : `<svg class="stat-icon ui-icon" viewBox="0 0 24 24"><rect x="2" y="7" width="16" height="10" rx="2" ry="2"></rect><line x1="22" y1="11" x2="22" y2="13"></line></svg>`;

    return `
        <div class="device-card" id="device-${device.id}">
            <div class="device-header">
                <div class="device-title-wrapper">
                    <div class="device-title">${device.cihaz_adi || 'İsimsiz Cihaz'}</div>
                    <div class="device-subtitle">${device.uretici} ${device.model} • Android ${device.android_surumu}</div>
                </div>
                <div id="status-badge-${device.id}" class="status-badge ${isOnline ? 'status-online' : 'status-offline'}">
                    <span class="status-dot"></span> <span class="status-text">${isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</span>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-box">
                    ${batterySVG}
                    <div class="stat-info">
                        <span class="stat-label">Pil Durumu</span>
                        <span class="stat-value" id="det-pil-${device.id}">${device.pil_yuzdesi != null ? `%${device.pil_yuzdesi}` : '-'} ${isCharging ? '(Şarj)' : ''}</span>
                    </div>
                </div>
                <div class="stat-box">
                    <svg class="stat-icon ui-icon" viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>
                    <div class="stat-info">
                        <span class="stat-label">Ağ Bağlantısı</span>
                        <span class="stat-value" id="det-ag-${device.id}">${device.ag_tipi || '-'}</span>
                    </div>
                </div>
                <div class="stat-box">
                    <svg class="stat-icon ui-icon" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <div class="stat-info">
                        <span class="stat-label">Konum Hata Payı</span>
                        <span class="stat-value" id="loc-acc-${device.id}">${device.son_konum_dogrulugu ? `±${device.son_konum_dogrulugu.toFixed(1)}m` : '-'}</span>
                    </div>
                </div>
                <div class="stat-box">
                    <svg class="stat-icon ui-icon" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                    <div class="stat-info">
                        <span class="stat-label">Son Güncelleme</span>
                        <span class="stat-value" id="loc-time-${device.id}">${formatTimeAgo(device.guncellenme_tarihi)}</span>
                    </div>
                </div>
            </div>

            <div id="map-${device.id}" class="map-container">
                ${!hasLoc ? '<div style="display:flex; flex-direction:column; align-items:center; gap:8px;"><svg class="ui-icon" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>Harita bilgisi bekleniyor...</div>' : ''}
            </div>
            
            <div class="card-actions">
                <button class="btn" onclick="openNotifications('${device.id}')">
                    <svg class="ui-icon" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                    Bildirimleri Gör
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
        badge.querySelector('.status-text').innerText = isOnline ? 'Çevrimiçi' : 'Çevrimdışı';
    }

    document.getElementById(`det-pil-${device.id}`).innerText = `${device.pil_yuzdesi != null ? `%${device.pil_yuzdesi}` : '-'} ${device.sarj_oluyor ? '(Şarj)' : ''}`;
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

// --- BİLDİRİM FİLTRELEME VE MODAL ---
window.openNotifications = async function(deviceId) {
    modal.classList.add('active');
    modalList.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Bildirimler getiriliyor...</p></div>';
    modalFilters.innerHTML = ''; 

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
        modalList.innerHTML = '<div class="loading-state"><svg class="ui-icon" style="width:40px;height:40px;margin-bottom:12px;opacity:0.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg><p>Bu filtreye ait bildirim bulunamadı.</p></div>';
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
                    <div class="notif-time">
                        <svg class="ui-icon" style="width:14px;height:14px;" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        ${formatTimeAgo(notif.olusturulma_tarihi)}
                    </div>
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
            badge.querySelector('.status-text').innerText = isOnline ? 'Çevrimiçi' : 'Çevrimdışı';
        }
    });
}, 15000);

fetchDevices();
setupRealtime();
