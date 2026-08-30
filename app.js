// Supabase Yapılandırması
const SUPABASE_URL = 'https://ubhixsmtpgvixgsnquzy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViaGl4c210cGd2aXhnc25xdXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMTM1MDcsImV4cCI6MjEwMzY4OTUwN30.UBgRfCbOODlA9Dx6P9fIev7jIC8vHkLwdRs668EEEdU';

// İstemciyi başlat (CDN üzerinden global 'supabase' nesnesi kullanılıyor)
const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const container = document.getElementById('devices-container');
let devicesData = [];

// Zaman hesaplama fonksiyonu
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

// Cihazın interneti koptuğunda "Çevrimiçi" kalmaması için Heartbeat güvenlik kontrolü
// Eğer son görülme üzerinden 2 dakikadan (120 sn) fazla geçmişse cihaz çevrimdışı sayılır
function checkOnlineStatus(sonGorulme) {
    if (!sonGorulme) return false;
    const date = new Date(sonGorulme);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    return diffInSeconds <= 120;
}

// Arayüzü Çizme
function renderDevices() {
    if (devicesData.length === 0) {
        container.innerHTML = '<p class="loading">Henüz cihaz bulunmuyor.</p>';
        return;
    }

    container.innerHTML = devicesData.map(device => {
        const isOnline = checkOnlineStatus(device.son_gorulme);
        const statusClass = isOnline ? 'status-online' : 'status-offline';
        const statusIcon = isOnline ? '🟢' : '🔴';
        const statusText = isOnline ? 'Çevrimiçi' : 'Çevrimdışı';

        const sicaklik = device.pil_sicakligi != null ? `${device.pil_sicakligi}°C` : 'Bilinmiyor';
        const pilYuzdesi = device.pil_yuzdesi != null ? `%${device.pil_yuzdesi}` : 'Bilinmiyor';
        const sarjDurumu = device.sarj_oluyor ? 'Evet' : 'Hayır';
        
        return `
            <div class="device-card">
                <div class="device-header">
                    <div class="device-title">${device.cihaz_adi || 'İsimsiz Cihaz'}</div>
                    <div class="device-subtitle">${device.uretici} ${device.model} (Android ${device.android_surumu})</div>
                </div>
                
                <div class="status-badge ${statusClass}">
                    ${statusIcon} ${statusText}
                </div>

                <div class="device-details">
                    <div class="detail-item">
                        <span class="detail-icon">🔋</span>
                        <span>Pil: ${pilYuzdesi}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">🔌</span>
                        <span>Şarj: ${sarjDurumu}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">📶</span>
                        <span>Ağ: ${device.ag_tipi || 'Bilinmiyor'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-icon">🌡️</span>
                        <span>Sıcaklık: ${sicaklik}</span>
                    </div>
                </div>

                <div class="footer-info">
                    <div>🕐 Son görülme: ${formatTimeAgo(device.son_gorulme)}</div>
                    <div>🔄 Son güncelleme: ${formatTimeAgo(device.guncellenme_tarihi)}</div>
                    <div>App: v${device.uygulama_surumu}</div>
                </div>
            </div>
        `;
    }).join('');
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

// Supabase Realtime - Anlık Değişiklikleri Dinleme
function setupRealtime() {
    client
        .channel('public:cihazlar')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cihazlar' }, payload => {
            if (payload.eventType === 'INSERT') {
                devicesData.unshift(payload.new);
            } else if (payload.eventType === 'UPDATE') {
                const index = devicesData.findIndex(d => d.id === payload.new.id);
                if (index !== -1) {
                    devicesData[index] = payload.new;
                } else {
                    devicesData.push(payload.new);
                }
            } else if (payload.eventType === 'DELETE') {
                devicesData = devicesData.filter(d => d.id !== payload.old.id);
            }
            
            // Tarihe göre yeniden sırala ve ekranı güncelle
            devicesData.sort((a, b) => new Date(b.son_gorulme) - new Date(a.son_gorulme));
            renderDevices();
        })
        .subscribe();
}

// Sayfa yenilenmeden "X saniye önce" yazılarının kendi kendine güncellenmesi için döngü
setInterval(renderDevices, 15000);

// Sistemi başlat
fetchDevices();
setupRealtime();
