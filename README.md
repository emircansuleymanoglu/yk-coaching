# YK Coaching

Yasin K. kişisel antrenörlük platformu — koç programları tek panelden oluşturur,
danışanlar telefondan (PWA) beslenme + antrenman + takviye programını görür.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase
(Postgres + Auth + Storage) · PWA.

---

## Kurulum

### 1. Supabase projesi oluştur

1. [app.supabase.com](https://app.supabase.com) → **New project**.
2. Proje oluşunca **SQL Editor**'ü aç, `supabase/migrations/0001_init.sql`
   dosyasının tamamını yapıştırıp **Run** de. (Tablolar + güvenlik + tetikleyiciler.)

### 2. Ortam değişkenleri

`.env.local.example` dosyasını `.env.local` olarak kopyala ve doldur
(Supabase → **Project Settings → API**):

```bash
cp .env.local.example .env.local
```

| Değişken | Nereden |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (gizli — yeni danışan oluşturmak için) |
| `NEXT_PUBLIC_BANK_IBAN` / `NEXT_PUBLIC_BANK_NAME` | Havale bilgileri (danışan ödeme ekranı) |

### 3. Koç (Yasin) hesabını oluştur

Supabase → **Authentication → Users → Add user** ile e-posta + şifre gir
(**Auto confirm** açık). Sonra **SQL Editor**'de rolünü koç yap:

```sql
update public.profiles set role = 'coach', full_name = 'Yasin K.'
where id = (select id from auth.users where email = 'yasin@mail.com');
```

### 4. Çalıştır

```bash
npm install
npm run dev
```

`http://localhost:3000` → Giriş yap → koç paneli açılır.

---

## Kullanım akışı

1. **Koç** panelden **Yeni Danışan** ekler (e-posta + geçici şifre belirler,
   danışana iletir).
2. Danışan detayında **Program Oluştur** → editörde beslenme (Low/High öğünler +
   gramajlı besinler, makro/kalori **otomatik**), takviye ve antrenman günlerini girer.
3. **Danışan** kendi e-postasıyla girer, programını mobilde şık biçimde görür.
4. Telefonda tarayıcı menüsünden **"Ana ekrana ekle"** → uygulama gibi açılır (PWA).

---

## PWA ikonları

`public/icons/icon.svg` ölçeklenebilir logo olarak kullanılıyor. İstersen
192×192 ve 512×512 PNG üretip `src/app/manifest.ts` içindeki ikon listesini
güncelleyebilirsin (bazı Android sürümleri PNG tercih eder).

## Yol haritası

- **Faz 1 (tamam):** Auth + roller, danışan yönetimi, program editörü
  (beslenme/antrenman/takviye), danışan görünümü, havale/ödeme durumu, PWA.
- **Faz 2:** Haftalık check-in (kilo/ölçü/foto) + grafikler, mesajlaşma, bildirimler.
- **Faz 3:** Abonelik hatırlatmaları, PDF dışa aktarma, program şablonları.
