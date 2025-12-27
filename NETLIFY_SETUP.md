# Netlify Deployment Talimatları

## Environment Variables

Netlify dashboard'unda aşağıdaki environment variable'ı eklemelisiniz:

### Site Settings > Environment Variables

1. Netlify dashboard'una gidin
2. Site Settings > Environment Variables'a tıklayın
3. "Add a variable" butonuna tıklayın
4. Aşağıdaki değeri ekleyin:

**Key:** `VITE_GEMINI_API_KEY`  
**Value:** `AIzaSyBV6xkzwqdbKkiMirAJArlTO9ctHsQZrS4`

## Deploy

Environment variable ekledikten sonra:

```bash
git push
```

Netlify otomatik olarak deploy edecektir.

## Local Development

Local development için `.env` dosyası zaten mevcuttur ve gitignore'dadır.
