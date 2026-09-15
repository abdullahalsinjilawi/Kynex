const nodemailer = require('nodemailer');

/**
 * إرسال إيميل. لو إعدادات SMTP غير موجودة بالـ .env (وضع التطوير المحلي)،
 * بيطبع محتوى الإيميل بالـ console بدل ما يحاول يرسل فعلياً، حتى تقدر تكمل تطوير وتختبر بدون حساب SMTP حقيقي.
 *
 * لما تصير جاهز للإنتاج، عبّي SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM بالـ .env
 * (مثلاً عن طريق SendGrid, Mailgun, أو حتى Gmail SMTP للتجربة)
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const hasSmtpConfig =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (!hasSmtpConfig) {
    console.log('\n📧 [وضع التطوير - ما تم إرسال إيميل حقيقي]');
    console.log(`إلى: ${to}`);
    console.log(`الموضوع: ${subject}`);
    console.log(`المحتوى: ${text}\n`);
    return { simulated: true };
  }

  const port = Number(process.env.SMTP_PORT) || 587;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // بورت 465 بيحتاج TLS ضمني (secure: true) من البداية، وبورت 587 (الأكثر شيوعاً)
    // بيستخدم STARTTLS فبيبلش الاتصال عادي (secure: false) وبعدين بيرقّي للتشفير -
    // لو حطينا secure: false بالغلط مع بورت 465 الاتصال بيفشل بالكامل
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
      html,
    });
    return { simulated: false };
  } catch (err) {
    // لو الإرسال الفعلي فشل (فايروول، مزوّد الإيميل واقع، إعدادات SMTP غلط...)، منطبع
    // المحتوى بالـ console كحل احتياطي - أهم شي بحالة التطوير المحلي إنك تقدر تكمل
    // اختبارك (تاخد الكود من التيرمنال) حتى لو SMTP مش شغالة، بدل ما تعلق بدون أي طريقة
    // توصل فيها للكود. الاستدعاء الأصلي لسه بيعرف
    // إنه الإرسال فشل عن طريق الخطأ يلي منرميه، فيقدر يعرض رسالة مناسبة للمستخدم
    console.log('\n⚠️  فشل إرسال الإيميل فعلياً - المحتوى مطبوع هون كحل احتياطي:');
    console.log(`إلى: ${to}`);
    console.log(`الموضوع: ${subject}`);
    console.log(`المحتوى: ${text}\n`);
    throw err;
  }
};

module.exports = sendEmail;
