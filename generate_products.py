import json
from collections import defaultdict

# Fatura verilerini oku
with open('fatura/Fatura.json', 'r', encoding='utf-8') as f:
    fatura1 = json.load(f)

with open('fatura/Fatura2.json', 'r', encoding='utf-8-sig') as f:
    fatura2 = json.load(f)

# Kategorilere ayır
categories = defaultdict(list)

def categorize_product(product_name):
    """Ürün adına göre kategori belirle"""
    name_upper = product_name.upper()
    
    # Kablo kategorileri
    if any(k in name_upper for k in ['NYY', 'NYM', 'TTR', 'NYAF', 'NYA', 'AER', 'YAVV', 'KABLO']):
        if 'NYY' in name_upper or 'YVV' in name_upper:
            return 'Kablo - NYY'
        elif 'NYM' in name_upper or 'NVV' in name_upper:
            return 'Kablo - NYM'
        elif 'TTR' in name_upper:
            return 'Kablo - TTR'
        elif 'NYAF' in name_upper:
            return 'Kablo - NYAF'
        elif 'NYA' in name_upper:
            return 'Kablo - NYA'
        elif 'AER' in name_upper:
            return 'Kablo - AER'
        elif 'YAVV' in name_upper:
            return 'Kablo - YAVV'
        else:
            return 'Kablo - Diger'
    
    # Otomat ve sigorta
    elif any(k in name_upper for k in ['OTOMAT', 'SIGORTA', 'KACAK AKIM', 'RCD']):
        return 'Otomat ve Sigorta'
    
    # Priz ve anahtar
    elif any(k in name_upper for k in ['PRIZ', 'ANAHTAR', 'SOKET']):
        return 'Priz ve Anahtar'
    
    # Kutu ve pano malzemeleri
    elif any(k in name_upper for k in ['KUTU', 'PANO', 'SASE']):
        return 'Kutu ve Pano'
    
    # Aydınlatma
    elif any(k in name_upper for k in ['ARMATUR', 'LED', 'LAMBA', 'SPOT', 'AYDINLATMA', 'PROJEKTOR']):
        return 'Aydinlatma'
    
    # Kablo kanalı ve koruma
    elif any(k in name_upper for k in ['KANAL', 'OLUKLU', 'BORU', 'HORTUM', 'KAFES']):
        return 'Kablo Kanali ve Koruma'
    
    # Bağlantı elemanları
    elif any(k in name_upper for k in ['KLEMENS', 'APARAT', 'BAGLANTI', 'KONNEKTOR', 'TERMINAL']):
        return 'Baglanti Elemanlari'
    
    # Topraklama
    elif any(k in name_upper for k in ['TOPRAKLAMA', 'PARATONER']):
        return 'Topraklama'
    
    else:
        return 'Diger Malzemeler'

# Fatura1'den ürünleri kategorize et
for item in fatura1:
    urun = item.get('URUN', '').strip()
    fiyat = item.get('BIRIM FIYAT', 0)
    marka = item.get('MARKA', 'Genel')
    
    if urun and isinstance(fiyat, (int, float)) and fiyat > 0:
        category = categorize_product(urun)
        categories[category].append({
            'name': urun,
            'price': float(fiyat),
            'marka': marka
        })

# Fatura2'den ürünleri kategorize et
for item in fatura2:
    urun = item.get('Urun/hizmet', '').strip()
    fiyat_raw = item.get('Birim fiyati', 0)
    
    # Fiyatı float'a çevir
    try:
        fiyat = float(fiyat_raw) if fiyat_raw else 0
    except:
        fiyat = 0
    
    if urun and fiyat > 0:
        category = categorize_product(urun)
        categories[category].append({
            'name': urun,
            'price': fiyat,
            'marka': 'Genel'
        })

# Her kategoriden unique ürünleri al
unique_products = {}
for category, products in categories.items():
    seen = {}
    for prod in products:
        key = prod['name'].strip().upper()
        if key not in seen:
            seen[key] = prod
    unique_products[category] = list(seen.values())

# JavaScript array formatında çıktı oluştur
with open('product_list.txt', 'w', encoding='utf-8') as f:
    f.write("const initialData = [\n")
    
    for category in sorted(unique_products.keys()):
        f.write(f"\n  // --- {category} ({len(unique_products[category])} urun) ---\n")
        for prod in sorted(unique_products[category], key=lambda x: x['name']):
            name = prod['name'].replace('"', '\\"').replace('\n', ' ')
            price = prod['price']
            f.write(f'  {{ category: "{category}", name: "{name}", price: {price:.2f} }},\n')
    
    f.write("];\n")

total = sum(len(prods) for prods in unique_products.values())
print(f"TOPLAM {total} farkli urun product_list.txt dosyasina yazildi!")
