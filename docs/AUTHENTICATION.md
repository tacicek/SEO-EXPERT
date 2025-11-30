# Authentication System Documentation

Bu dokümantasyon, SEO Expert AI uygulamasına eklenen authentication (kimlik doğrulama) sistemini açıklar.

## 🔐 Genel Bakış

Uygulama, Supabase Auth kullanarak tam özellikli bir kimlik doğrulama sistemi içerir.

## 📁 Oluşturulan Dosyalar

### 1. Authentication Functions (`lib/auth/supabase-auth.ts`)
Supabase ile etkileşim için temel auth fonksiyonları:

```typescript
- signUp(email, password, fullName) - Yeni hesap oluştur
- signIn(email, password) - Giriş yap
- signOut() - Çıkış yap
- getCurrentUser() - Mevcut kullanıcıyı al
- getSession() - Aktif oturumu al
- resetPassword(email) - Şifre sıfırlama
- updatePassword(newPassword) - Şifre güncelle
- updateProfile(updates) - Profil güncelle
- signInWithGoogle() - Google ile giriş (OAuth)
- signInWithGitHub() - GitHub ile giriş (OAuth)
```

### 2. Auth Provider (`lib/providers/auth-provider.tsx`)
React Context ile global auth state yönetimi:

```typescript
interface AuthContextType {
  user: SupabaseUser | null;
  loading: boolean;
  signIn: (email, password) => Promise<void>;
  signUp: (email, password, fullName?) => Promise<void>;
  signOut: () => Promise<void>;
}
```

**Özellikler:**
- Otomatik oturum kontrolü
- Auth state değişikliklerini dinleme
- Global user state

### 3. Login Page (`app/auth/login/page.tsx`)
Kullanıcı giriş sayfası:

**Features:**
- Email/Password giriş
- Google OAuth (hazır)
- GitHub OAuth (hazır)
- Forgot password linki
- Sign up linki
- Error handling
- Loading states
- Responsive design

### 4. Register Page (`app/auth/register/page.tsx`)
Yeni kullanıcı kayıt sayfası:

**Features:**
- Full name field
- Email/Password kayıt
- Password confirmation
- Password validation (min 6 char)
- OAuth seçenekleri
- Success confirmation
- Error handling
- Auto redirect

### 5. Updated Header (`components/layout/Header.tsx`)
Kullanıcı menüsü ile güncellenmiş header:

**Logged Out:**
- Sign In button
- Sign Up button

**Logged In:**
- User avatar (initials)
- Dropdown menu:
  - User info (name, email)
  - Dashboard link
  - My Analyses link
  - Sign Out button

## 🚀 Kullanım

### 1. App Layout'a AuthProvider Eklendi
```typescript
// app/layout.tsx
<AuthProvider>
  <QueryProvider>{children}</QueryProvider>
</AuthProvider>
```

### 2. Component'lerde useAuth Hook

```typescript
'use client';
import { useAuth } from '@/lib/providers/auth-provider';

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <div>Please sign in</div>;
  }

  return <div>Welcome {user.email}</div>;
}
```

### 3. Protected Routes Örneği

```typescript
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/providers/auth-provider';

export default function ProtectedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return <div>Protected content</div>;
}
```

## 📋 Kullanıcı Akışları

### Kayıt (Sign Up)
1. `/auth/register` sayfasına git
2. Form doldur (name, email, password)
3. "Create Account" butonuna tıkla
4. Email verification beklenir (Supabase ayarlarına göre)
5. Success ekranı gösterilir
6. Ana sayfaya yönlendirilir

### Giriş (Sign In)
1. `/auth/login` sayfasına git
2. Email ve password gir
3. "Sign In" butonuna tıkla
4. Başarılıysa ana sayfaya yönlendir
5. Header'da user menu görünür

### Çıkış (Sign Out)
1. Header'daki avatar'a tıkla
2. "Sign Out" seçeneğini tıkla
3. Oturum sonlandırılır
4. Ana sayfaya redirect

## 🔧 Supabase Yapılandırması

### Auth Settings (Supabase Dashboard)

1. **Authentication → Providers**
   - Enable Email
   - (Opsiyonel) Enable Google OAuth
   - (Opsiyonel) Enable GitHub OAuth

2. **Authentication → Email Templates**
   - Customize confirmation email
   - Customize password reset email

3. **Authentication → URL Configuration**
   - Site URL: `https://your-domain.com`
   - Redirect URLs: 
     - `https://your-domain.com/auth/callback`
     - `http://localhost:3000/auth/callback` (dev)

### Environment Variables

Zaten `supabase/README.md`'de tanımlanmış:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

## 🎨 UI Components

Yeni eklenen shadcn/ui componentleri:

```bash
- components/ui/dropdown-menu.tsx
- components/ui/avatar.tsx
```

Mevcut componentler:
- Button
- Input
- Label
- Card
- Badge

## 🔒 Güvenlik

### Best Practices Kullanılıyor

✅ **Password Security:**
- Min 6 karakter validation
- Password confirmation
- Supabase'in encrypt sistemini kullanır

✅ **Session Management:**
- HTTP-only cookies (Supabase default)
- Automatic session refresh
- Secure token storage

✅ **API Security:**
- Row Level Security (RLS) Supabase'de
- Service role key sadece server-side
- Environment variables

✅ **XSS Protection:**
- React automatic escaping
- Content Security Policy headers (ekle)

## 📱 Responsive Design

Tüm auth sayfaları mobile-friendly:
- Responsive layout
- Mobile-optimized forms
- Touch-friendly buttons
- Em

bedded validation

## 🧪 Test Etme

### Manuel Test

1. **Register Test:**
```bash
1. Go to http://localhost:3000/auth/register
2. Fill in: name, email, password
3. Click "Create Account"
4. Check email for verification
5. Verify account created in Supabase
```

2. **Login Test:**
```bash
1. Go to http://localhost:3000/auth/login
2. Enter credentials
3. Click "Sign In"
4. Verify redirect to home
5. Check user menu in header
```

3. **Session Test:**
```bash
1. Sign in
2. Refresh page
3. Verify still logged in
4. Close tab, reopen
5. Verify session persists
```

4. **Sign Out Test:**
```bash
1. Click user avatar
2. Click "Sign Out"
3. Verify logged out
4. Verify redirect to home
5. Check buttons changed to "Sign In/Up"
```

## 🚧 Gelecek İyileştirmeler

- [ ] Forgot Password page (`/auth/forgot-password`)
- [ ] Password Reset page (`/auth/reset-password`)
- [ ] Email verification page
- [ ] Profile settings page
- [ ] Avatar upload
- [ ] OAuth Google implementation
- [ ] OAuth GitHub implementation
- [ ] Two-factor authentication
- [ ] Account deletion
- [ ] Password change in settings

## 🐛 Troubleshooting

### "User not Found" Hatası
```bash
Çözüm: Supabase'de user tablosunu kontrol edin
Veya: Email verification bekliyor olabilir
```

### Session Expired
```bash
Çözüm: Tekrar giriş yapın
Veya: Supabase token refresh interval'ı kontrol edin
```

### OAuth Redirect Hatası
```bash
Çözüm: Supabase → Authentication → URL Configuration
Redirect URL'leri doğru eklenmiş mi kontrol edin
```

## 📚 Kaynaklar

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js Authentication](https://nextjs.org/docs/authentication)
- [React Context API](https://react.dev/reference/react/useContext)

## ✅ Checklist

Deployment öncesi kontrol listesi:

- [x] Auth Provider app layout'a eklendi
- [x] Login page oluşturuldu
- [x] Register page oluşturuldu
- [x] Header user menu eklendi
- [x] Supabase config doğru
- [ ] Email templates customize edildi
- [ ] OAuth providers enabled (opsiyonel)
- [ ] Protected routes implement edildi
- [ ] Test edildi

---

**Last Updated:** 30.11.2024  
**Version:** 1.0.0  
**Status:** ✅ Ready for Use
