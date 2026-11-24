# نشر AUAR على سيرفرك

يشغّل هذا الدليل المنصة كاملة (تطبيق الراكب + الكابتن + لوحة الإدارة + الخادم) على سيرفر Linux واحد، مع شهادة HTTPS تلقائية.

## المتطلبات

- سيرفر Ubuntu 22.04 أو 24.04 (يكفي 1 vCPU و1GB RAM) بعنوان IP عام.
- المنفذان 80 و443 مفتوحان في جدار الحماية.
- (اختياري لكنه مستحسن) نطاق مثل `auar.example.com` بسجل **A** يشير إلى IP السيرفر. بدون نطاق تعمل المنصة عبر http على عنوان الـIP، ولن يعمل تحديد الموقع ولا التثبيت كتطبيق على الجوال.

## الخطوات

1. ادخل إلى السيرفر:
   ```bash
   ssh root@SERVER_IP
   ```
2. انسخ المستودع (إذا كان خاصاً استخدم Personal Access Token من GitHub ككلمة مرور):
   ```bash
   git clone -b claude/uber-ride-app-design-btt4s0 https://github.com/sg7szczbv5-collab/indx.git
   cd indx/auar
   ```
3. شغّل الإعداد. يثبّت Docker إن لم يكن موجوداً، ويسألك عن النطاق وبريد وكلمة مرور الإدارة، ثم يبني ويشغّل:
   ```bash
   sudo bash deploy/setup.sh
   ```
4. افتح `https://نطاقك`. أول تشغيل يحتاج دقيقة لإصدار شهادة HTTPS.

## الروابط

| | الرابط |
|---|---|
| البوابة | `https://نطاقك/` |
| تطبيق الراكب | `https://نطاقك/#rider` |
| تطبيق الكابتن | `https://نطاقك/#driver` |
| لوحة الإدارة | `https://نطاقك/#admin` |
| العرض المباشر | `https://نطاقك/#demo` |

## الوضع التجريبي

الإعدادات الافتراضية في ملف `.env`:

- `AUAR_DEMO=1`: بيانات تجريبية، وأزرار «دخول بحساب تجريبي»، وكباتن محاكاة يقبلون الطلبات.
- `DEMO_RESET_HOURS=6`: تُعاد البيانات التجريبية لحالتها الأولى كل ٦ ساعات، لأن الزوار يستطيعون تعديلها.
- `DEMO_ADMIN_LOGIN=1`: يستطيع الزوار فتح لوحة الإدارة بزر «دخول تجريبي». ضعه `0` لتكون أنت وحدك من يدخل بكلمة المرور.
- رموز التحقق (SMS) تظهر على الشاشة في الوضع التجريبي ولا تُرسل فعلياً.

بعد أي تعديل على `.env` شغّل: `docker compose up -d`

## أوامر مفيدة

```bash
docker compose logs -f app                      # سجل الخادم (ورموز التحقق)
git pull && docker compose up -d --build        # تحديث لآخر نسخة
docker compose down                             # إيقاف
docker compose exec app sh -c 'cp /data/auar.db /data/backup-$(date +%F).db'   # نسخة احتياطية
```

## الانتقال إلى الإطلاق الفعلي لاحقاً

عدّل `.env` بهذه القيم:

```
AUAR_DEMO=0
SMS_PROVIDER=unifonic
UNIFONIC_APP_SID=...
PAYMENTS_PROVIDER=moyasar
MOYASAR_SECRET_KEY=...
```

ثم احذف بيانات الديمو وابدأ بقاعدة فارغة:

```bash
docker compose down
docker volume rm auar_auar-data
docker compose up -d
```

يُنصح بإكمال الخرائط الحقيقية وتطبيقات الجوال قبل استقبال ركاب حقيقيين.
