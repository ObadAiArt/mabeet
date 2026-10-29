// ===== تعهد ولي الأمر — خادم الحفظ (Google Apps Script) =====
// 1) غيّر كلمة المرور هنا:
const ADMIN_KEY = 'غيّر-كلمة-المرور-هنا';
// 2) اسم المجلد في Google Drive الذي ستُحفظ فيه التوقيعات:
const FOLDER_NAME = 'تعهدات الاعتكاف';

function getFolder() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}
function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// استلام تعهد جديد من صفحة ولي الأمر
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action !== 'save') return json({ ok: false, error: 'bad action' });
    const d = body.data || {};
    const b64 = String(body.image).split(',')[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(b64), 'image/png');
    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
    const file = getFolder().createFile(blob.setName(`توقيع - ${d.student || ''} - ${stamp}.png`));
    file.setDescription(JSON.stringify({ guardian: d.guardian, student: d.student, phone: d.phone }));
    return json({ ok: true, id: file.getId() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// قائمة التعهدات أو جلب توقيع واحد (لصفحة المسؤول)
function doGet(e) {
  const p = e.parameter || {};
  if (p.key !== ADMIN_KEY) return json({ ok: false, error: 'كلمة المرور غير صحيحة' });
  if (p.action === 'get') {
    const f = DriveApp.getFileById(p.id);
    const b = f.getBlob();
    return json({ ok: true, image: 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes()) });
  }
  if (p.action !== 'list') return json({ ok: false, error: 'bad action' });
  const files = [];
  const it = getFolder().getFiles();
  while (it.hasNext()) {
    const f = it.next();
    let meta = {};
    try { meta = JSON.parse(f.getDescription() || '{}'); } catch (_) {}
    files.push({
      id: f.getId(),
      guardian: meta.guardian || '', student: meta.student || '', phone: meta.phone || '',
      created: Utilities.formatDate(f.getDateCreated(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'),
      ts: f.getDateCreated().getTime(),
    });
  }
  files.sort((a, b) => b.ts - a.ts);
  return json({ ok: true, files });
}
