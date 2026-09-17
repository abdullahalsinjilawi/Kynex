# ---------- مرحلة ١: البناء ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

# قيمة VITE_API_URL لازم تنبعت وقت البناء (Build-time)، مش وقت التشغيل — لأنو Vite
# بيخبزها جوا ملفات الـ JS النهائية أثناء "npm run build". لو انضبطت بس كـ Environment
# Variable عادي (Runtime) بدون ما تنمرر هون كـ ARG، التغيير ما رح ينعكس إطلاقاً
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY . .
RUN npm run build

# ---------- مرحلة ٢: التشغيل ----------
# صورة نهائية خفيفة جداً، فيها بس ناتج البناء (dist/) + سيرفر ستاتيك بسيط
FROM node:20-alpine
WORKDIR /app

RUN npm install -g serve
COPY --from=build /app/dist ./dist

# رقم بورت ثابت (بدل الاعتماد على متغير Render التلقائي) — لازم تحط نفس الرقم
# بإعدادات الـ Networking/Public Port بلوحة Northflank
ENV PORT=3000
EXPOSE 3000

# فلاگ -s (single-page-app) هو الحل الحقيقي لمشكلة الـ 404 عند فتح رابط زي /upload
# مباشرة أو عمل refresh عليه: أي رابط ما إله ملف فعلي، السيرفر برجّع index.html له
# تلقائياً بدل Not Found، وReact Router بعدين ياخذ القرار من جوا المتصفح. هيك
# ما عاد محتاجين قاعدة Rewrite منفصلة بلوحة تحكم الاستضافة
CMD ["sh", "-c", "serve -s dist -l ${PORT}"]
