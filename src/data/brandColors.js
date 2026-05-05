export const brandColors = {
    'KMX': '#b7000d',
    'KM POWER': '#f7df00',
    'KMPOWER': '#f7df00',          // Alias sin espacio
    'KMPRO': '#e15100',
    'KM PRO': '#e15100',           // Alias con espacio
    'KM GARDEN': '#2c5336',
    'KMGARDEN': '#2c5336',         // Alias sin espacio
    'KONTROL': '#ffff00',
    'PRO TORK': '#feee00',
    'PROTORK': '#feee00',          // Alias sin espacio
    'VEDAMOTORS': '#ff0000',
    'CANELLO': '#071d87',
    'CIRCUIT': '#f9e515',
    'CROMO FORTE': '#535252',
    'CROMOFORTE': '#535252',
    'D.I.D': '#db0000',
    'DID': '#db0000',
    'DELTA': '#253a49',
    'DIAFRAG': '#ce0000',
    'DURAG': '#ffed00',
    'EXTRON': '#e37f1e',
    'GMIX': 'linear-gradient(to right, #966a0a, #f3e4a6, #966a0a)',
    'KI FREIO': '#ae0613',
    'KIFREIO': '#ae0613',          // Alias sin espacio
    'MERCURIO': '#c20e1a',
    'METALROPER': '#ffff00',
    'MOTOBOR': '#f7931e',
    'MS EXTENSOR': '#ff0000',
    'MSEXTENSOR': '#ff0000',       // Alias sin espacio
    'PLASMOTO': '#1d3277',
    'POLIMET': '#035f1aff',
    'POLIVISOR': '#a3a3a3',
    'PROJEÇÃO': 'linear-gradient(to right, #0063c6, #01b6fc)',
    'RIC': '#b3b3b3',
    'RINALDI': '#ce0000',
    'SIVERST': '#649fbc',
    'STALLION': '#b6000b',
    'STYLU': 'linear-gradient(to right, #0291ff, #001d3a)',
    'TAURUS': '#db0000',
    'UNIBREQ': '#161616',
    'VCV': '#be1602',
    'WGK': '#ff0000',
    'EGK': '#066006',
    'JETT': '#262626',
    'MEGAJET': '#d9a63a',
    'STAR FILTRO': '#1e3793',
    'STARFILTRO': '#1e3793',       // Alias sin espacio
};

export function getBrandColor(brandName) {
    if (!brandName) return '#D32F2F'; // Default brand-red
    const upper = brandName.toUpperCase().trim();
    return brandColors[upper] || '#D32F2F';
}

// Helper for when we specifically need a solid color (e.g. for borders/shadows where gradients might be tricky)
// If it's a gradient, we extract the first color
export function getBrandSolidColor(brandName) {
    const color = getBrandColor(brandName);
    if (color.startsWith('linear-gradient')) {
        // Extract first hex code
        const match = color.match(/#[0-9a-fA-F]{6}/);
        return match ? match[0] : '#D32F2F';
    }
    return color;
}
// Determine if white or black text should be used based on background brightness
export function getContrastColor(hexColor) {
    if (!hexColor || !hexColor.startsWith('#')) return '#ffffff';
    
    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate brightness (YIQ formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    return brightness > 128 ? '#000000' : '#ffffff';
}
