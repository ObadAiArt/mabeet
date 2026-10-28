// ===== تعهد ولي الأمر — خادم الحفظ (Google Apps Script) =====
// 1) غيّر كلمة المرور هنا:
const ADMIN_KEY = 'غيّر-كلمة-المرور-هنا';
// 2) اسم المجلد في Google Drive الذي ستُحفظ فيه الملفات:
const FOLDER_NAME = 'تعهدات الاعتكاف';

function getFolder() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}
function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

// حفظ ملف جديد (يأتي من صفحة ولي الأمر)
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action !== 'save') return json({ ok: false, error: 'bad action' });
    const d = body.data || {};
    const b64 = String(body.image).split(',')[1];
    const blob = Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg');
    const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');
    const name = `تعهد - ${d.student || ''} - ${stamp}.jpg`;
    const file = getFolder().createFile(blob.setName(name));
    file.setDescription(JSON.stringify({ guardian: d.guardian, student: d.student, phone: d.phone, mosque: d.mosque, day: d.day, date: d.date }));
    return json({ ok: true, id: file.getId() });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// قائمة الملفات (لصفحة المسؤول)
function doGet(e) {
  const p = e.parameter || {};
  if (p.key !== ADMIN_KEY) return json({ ok: false, error: 'كلمة المرور غير صحيحة' });
  if (p.action !== 'list') return json({ ok: false, error: 'bad action' });
  const folder = getFolder();
  const files = [];
  const it = folder.getFiles();
  while (it.hasNext()) {
    const f = it.next();
    let meta = {};
    try { meta = JSON.parse(f.getDescription() || '{}'); } catch (_) {}
    files.push({
      id: f.getId(), name: f.getName(),
      guardian: meta.guardian || '', student: meta.student || '', phone: meta.phone || '',
      created: Utilities.formatDate(f.getDateCreated(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm'),
      url: `https://drive.google.com/uc?export=download&id=${f.getId()}`,
      ts: f.getDateCreated().getTime(),
    });
  }
  files.sort((a, b) => b.ts - a.ts);
  return json({ ok: true, files, folderUrl: folder.getUrl() });
}
