<div dir="rtl" align="center">

# 🛡️ حَارِس | Hares AI

### منصة ذكية مدعومة بالذكاء الاصطناعي لتحليل أمان تطبيقات أندرويد (APK)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)](https://www.prisma.io/)
[![Bun](https://img.shields.io/badge/Bun-Runtime-000?logo=bun)](https://bun.sh/)

</div>

---

<div dir="rtl" align="center">

**حَارِس** (بمعنى "الحارس") هي منصة عربية مفتوحة المصدر لتحليل أمان ملفات APK باستخدام الذكاء الاصطناعي. يقوم الحارس بفحص تطبيقات أندرويد وكشف الثغرات الأمنية، الأذونات الخطيرة، الأسرار المضمّنة، وتقديم توصيات أمنية باللغة العربية.

[🚀 ابدأ الآن](#-البدء-السريع) · [📄 التوثيق](#-توثيق-واجهة-api) · [🤝 المساهمة](#-المساهمة) · [📜 الرخصة](#-الرخصة)

</div>

---

## 📸 لقطات الشاشة

<!-- أضف لقطات الشاشة هنا -->
<div dir="rtl" align="center">

| الصفحة الرئيسية | لوحة النتائج |
|:---:|:---:|
| ![Landing](https://placehold.co/800x450/1a1a2e/eaeaea?text=صفحة+الرئيسية) | ![Dashboard](https://placehold.co/800x450/1a1a2e/eaeaea?text=لوحة+النتائج) |

| تحليل الأذونات | تقرير الذكاء الاصطناعي |
|:---:|:---:|
| ![Permissions](https://placehold.co/800x450/1a1a2e/eaeaea?text=تحليل+الأذونات) | ![AI Report](https://placehold.co/800x450/1a1a2e/eaeaea?text=تقرير+الذكاء+الاصطناعي) |

</div>

---

## ✨ المميزات الرئيسية

<div dir="rtl">

| الميزة | الوصف |
|---|---|
| 🔍 **تحليل APK متقدم** | فك ضغط وتحليل ملفات APK بشكل كامل، بما في ذلك AndroidManifest.xml الثنائي |
| 🤖 **تحليل بالذكاء الاصطناعي** | شرح مفصّل باللغة العربية لمخاطر التطبيق باستخدام نماذج ذكاء اصطناعي متقدمة |
| ⚠️ **كشف الأذونات الخطيرة** | التعرف على 20+ إذن خطير مع التسمية العربية ومستوى الخطورة |
| 🔑 **كشف الأسرار المضمّنة** | اكتشاف مفاتيح API، رموز المصادقة، كلمات المرور، ومفاتيح AWS/Google المضمّنة في الكود |
| 📊 **درجة المخاطر (0-100)** | خوارزمية تسجيل ذكية تحسب مستوى الخطورة بناءً على عوامل متعددة |
| 🌐 **كشف نقاط الاتصال** | تحديد جميع عناوين URL ونقاط الاتصال (API Endpoints) والتأكد من استخدام HTTPS |
| 📚 **التعرف على المكتبات** | كشف 30+ مكتبة معروفة (Firebase، Facebook SDK، OkHttp، Retrofit...) |
| 📝 **تقارير HTML** | إنشاء تقارير HTML تفاعلية وقابلة للتحميل بتصميم عربي احترافي |
| 🎭 **وضع العرض التجريبي** | تجربة المنصة بتحليل وهمي لتطبيق "تسوّق بلس" بدون رفع ملفات حقيقية |
| 🇸🇦 **واجهة عربية كاملة** | واجهة مستخدم RTL بالكامل بخط Tajawal العربي |

</div>

---

## 🧠 كيف يعمل التحليل

<div dir="rtl">

```
📄 رفع ملف APK
    │
    ▼
📦 فك ضغط الأرشيف (ZIP)
    │
    ├── 🔍 تحليل AndroidManifest.xml الثنائي
    │       ├── استخراج اسم الحزمة والإصدار
    │       ├── كشف الأذونات المطلوبة
    │       └── تحديد إصدار SDK المستهدف
    │
    ├── 🔑 مسح الملفات الحساسة (DEX, XML, JSON)
    │       ├── البحث عن مفاتيح API وأسرار
    │       ├── كشف عناوين URL غير الآمنة
    │       └── تحديد البيانات المشفرة بـ Base64
    │
    ├── 📚 التعرف على المكتبات المستخدمة
    │
    ▼
📊 حساب درجة المخاطر (0-100)
    │
    ▼
🤖 تحليل بالذكاء الاصطناعي
    │       ├── ملخص تنفيذي
    │       ├── شرح المخاطر
    │       ├── تحليل الأذونات
    │       ├── توصيات أمنية
    │       └── الحكم النهائي
    │
    ▼
📋 عرض النتائج + إنشاء تقرير HTML
```

</div>

---

## 🛠️ التقنيات المستخدمة

<div dir="rtl" align="center">

| التقنية | الاستخدام |
|---|---|
| ![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js) | إطار العمل الرئيسي (App Router) |
| ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript) | لغة البرمجة |
| ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwind-css) | تنسيق الواجهة |
| ![shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest-000) | مكونات الواجهة |
| ![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma) | قاعدة البيانات (SQLite) |
| ![Zustand](https://img.shields.io/badge/Zustand-5-orange) | إدارة الحالة |
| ![z-ai-web-dev-sdk](https://img.shields.io/badge/z--ai--sdk-0.0.17-purple) | تكامل الذكاء الاصطناعي |
| ![adm-zip](https://img.shields.io/badge/adm--zip-latest-yellow) | فك ضغط APK |
| ![React Markdown](https://img.shields.io/badge/React_Markdown-10-green) | عرض نتائج AI |
| ![Recharts](https://img.shields.io/badge/Recharts-2-red) | رسوم بيانية |
| ![Bun](https://img.shields.io/badge/Bun-Runtime-000?logo=bun) | وقت التشغيل ومدير الحزم |

</div>

---

## 🚀 البدء السريع

<div dir="rtl">

### المتطلبات الأساسية

- [Bun](https://bun.sh/) >= 1.0
- Node.js >= 18 (للتوافقية)

### التثبيت

```bash
# استنساخ المستودع
git clone https://github.com/hares-ai/hares-ai.git
cd hares-ai

# تثبيت التبعيات
bun install

# إعداد قاعدة البيانات
bun run db:push

# إنشاء ملف البيئة
cp .env.example .env.local
# أضف مفتاح الذكاء الاصطناعي في .env.local:
# Z_AI_API_KEY=your_api_key_here

# تشغيل الخادم المحلي
bun run dev
```

افتح المتصفح على [http://localhost:3000](http://localhost:3000)

### أوامر مفيدة

```bash
bun run dev          # تشغيل بيئة التطوير
bun run build        # بناء للإنتاج
bun run start        # تشغيل نسخة الإنتاج
bun run lint         # فحص الكود
bun run db:push      # تحديث قاعدة البيانات
bun run db:generate  # توليد Prisma Client
bun run db:migrate   # تشغيل الترحيلات
bun run db:reset     # إعادة تعيين قاعدة البيانات
```

</div>

---

## 📁 هيكل المشروع

<div dir="rtl">

```
hares-ai/
├── 📂 prisma/
│   └── schema.prisma          # مخطط قاعدة البيانات
├── 📂 public/
│   ├── logo.svg               # شعار المشروع (SVG)
│   └── logo-hares.png         # شعار المشروع (PNG)
├── 📂 src/
│   ├── 📂 app/
│   │   ├── layout.tsx         # التخطيط الرئيسي (RTL + خط Tajawal)
│   │   ├── page.tsx           # الصفحة الرئيسية
│   │   ├── globals.css        # الأنماط العامة
│   │   └── 📂 api/
│   │       ├── route.ts       # نقطة API الرئيسية
│   │       ├── 📂 analyze/
│   │       │   └── route.ts   # رفع وتحليل APK
│   │       ├── 📂 analyses/
│   │       │   └── route.ts   # استعلام نتائج التحليل
│   │       └── 📂 report/
│   │           └── route.ts   # إنشاء تقرير HTML
│   ├── 📂 components/
│   │   └── 📂 ui/             # مكونات shadcn/ui
│   ├── 📂 hooks/              # React Hooks
│   │   ├── use-mobile.ts
│   │   └── use-toast.ts
│   └── 📂 lib/
│       ├── analyzer.ts        # 🔍 محرك تحليل APK
│       ├── ai-analyzer.ts     # 🤖 محرك الذكاء الاصطناعي
│       ├── db.ts              # 🗄️ اتصال قاعدة البيانات
│       ├── store.ts           # 📦 إدارة الحالة (Zustand)
│       └── utils.ts           # 🔧 أدوات مساعدة
├── .env.example               # متغيرات البيئة (نموذج)
├── .gitignore
├── Caddyfile                  # إعدادات خادم Caddy
├── components.json            # إعدادات shadcn/ui
├── next.config.ts             # إعدادات Next.js
├── package.json
├── tailwind.config.ts         # إعدادات Tailwind CSS
└── tsconfig.json              # إعدادات TypeScript
```

</div>

---

## 📄 توثيق واجهة API

<div dir="rtl">

### `POST /api/analyze` — رفع وتحليل ملف APK

يرفع ملف APK ويبدأ عملية التحليل بشكل غير متزامن.

**المعاملات (FormData):**

| المعامل | النوع | مطلوب | الوصف |
|---|---|---|---|
| `file` | File | نعم* | ملف APK المراد تحليله |
| `demo` | string | لا | تعيين `"true"` لتفعيل وضع العرض التجريبي |

> *مطلوب `file` أو `demo=true` (أحدهما على الأقل)

**الاستجابة:**

```json
{
  "success": true,
  "analysisId": "cm3x...",
  "message": "Analysis started"
}
```

---

### `GET /api/analyses` — استعلام نتائج التحليل

يستعلم عن حالة التحليل ونتائجه.

| المعامل | النوع | مطلوب | الوصف |
|---|---|---|---|
| `id` | string | نعم | معرّف التحليل |

**حالات التحليل:** `analyzing` → `ai-analyzing` → `completed` / `failed`

---

### `GET /api/report` — إنشاء تقرير HTML

يُنشئ تقرير HTML تفاعلي لتحليل مكتمل.

| المعامل | النوع | مطلوب | الوصف |
|---|---|---|---|
| `id` | string | نعم | معرّف التحليل |

**الاستجابة:** صفحة HTML كاملة قابلة للتحميل.

---

### `GET /api` — فحص حالة الخادم

يتحقق من أن الخادم يعمل بشكل صحيح.

**الاستجابة:**

```json
{
  "status": "ok",
  "service": "Hares AI"
}
```

</div>

---

## 🔐 خوارزمية درجة المخاطر

<div dir="rtl">

يحسب حَارِس درجة المخاطر من 0 إلى 100 بناءً على العوامل التالية:

| العامل | النقاط | الحد الأقصى |
|---|---|---|
| 🔴 أذونات عالية الخطورة | +15 لكل إذن | بلا حدود |
| 🟡 أذونات متوسطة الخطورة | +8 لكل إذن | بلا حدود |
| 🔑 أسرار مضمّنة في الكود | +20 لكل سر | 40 |
| 🌐 عناوين URL غير آمنة (HTTP) | +10 لكل عنوان | 20 |
| 📝 سلاسل حساسة | +5 لكل سلسلة | 30 |

**الحد الأقصى الكلي: 100** — الدرجة الأعلى تعني خطرًا أكبر.

</div>

---

## 🤝 المساهمة

<div dir="rtl">

نرحب بمساهماتكم! اتبع الخطوات التالية:

1. 🍴 قم بعمل Fork للمستودع
2. 🌿 أنشئ فرعًا جديدًا (`git checkout -b feature/amazing-feature`)
3. 💾 احفظ التغييرات (`git commit -m '✨ إضافة ميزة رائعة'`)
4. 📤 ارفع الفرع (`git push origin feature/amazing-feature`)
5. 🔄 أنشئ Pull Request

### إرشادات المساهمة

- التزم بمعايير الكود الموجودة (ESLint)
- أضف تعليقات توضيحية باللغة العربية عند الحاجة
- تأكد من اجتياز فحص `bun run lint` بدون أخطاء
- اختبر التغييرات محليًا قبل الإرسال

</div>

---

## 📜 الرخصة

<div dir="rtl">

هذا المشروع مرخّص بموجب [رخصة MIT](LICENSE).

</div>

```
MIT License

Copyright (c) 2025 Hares AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 📞 التواصل والمعلومات

<div dir="rtl" align="center">

| | |
|---|---|
| 🌐 الموقع | [hares-ai.dev](https://hares-ai.dev) |
| 📧 البريد الإلكتروني | contact@hares-ai.dev |
| 🐛 الإبلاغ عن الأخطاء | [GitHub Issues](https://github.com/hares-ai/hares-ai/issues) |
| 💬 المناقشات | [GitHub Discussions](https://github.com/hares-ai/hares-ai/discussions) |

</div>

---

<div dir="rtl" align="center">

**صُنع بـ ❤️ لحماية مستخدمي أندرويد العرب**

⭐ إذا أعجبك المشروع، لا تنسَ إضافة نجمة!

</div>
