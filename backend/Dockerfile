# صورة خفيفة، بس نفس نسخة Node يلي مكتوبة بملف package.json (engines) لو موجودة
FROM node:20-alpine

WORKDIR /app

# ننسخ ملفات الباكدج لحالها أول، حتى Docker يقدر يكاش خطوة npm install
# ولا يعيدها إلا لو package.json/package-lock.json تغيّروا فعلياً
COPY package*.json ./
RUN npm install --omit=dev

COPY . .

# Northflank بيحدد رقم البورت من الإعدادات، وكودنا أصلاً بيقرأه من process.env.PORT
# (server.js: const PORT = process.env.PORT || 5000) فما في داعي نغيّر شي بالكود
EXPOSE 5000

CMD ["npm", "start"]
