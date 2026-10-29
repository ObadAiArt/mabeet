(function(){
  const C = window.CONFIG||{}, $=id=>document.getElementById(id);
  const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const status=(el,msg,cls)=>{ el.textContent=msg; el.className='status '+(cls||''); };
  if(!C.SCRIPT_URL) status($('loginStatus'),'لم يتم ضبط SCRIPT_URL في config.js بعد. راجع README.','err');
  let key = sessionStorage.getItem('mabeet_key')||''; $('key').value = key;
  let files = [];

  // بيانات المبيت تُحفظ في متصفح المسؤول
  try{ const s=JSON.parse(localStorage.getItem('mabeet_settings')||'{}'); $('s_mosque').value=s.mosque||''; $('s_day').value=s.day||''; $('s_date').value=s.date||''; }catch(e){}
  ['s_mosque','s_day','s_date'].forEach(id=>$(id).addEventListener('change',()=>{
    localStorage.setItem('mabeet_settings', JSON.stringify({mosque:$('s_mosque').value,day:$('s_day').value,date:$('s_date').value}));
  }));

  async function load(){
    const st=$('loginStatus'); status(st,'جاري التحميل...','ok');
    try{
      const r = await fetch(`${C.SCRIPT_URL}?action=list&key=${encodeURIComponent(key)}`); const j = await r.json();
      if(!j.ok) throw new Error(j.error||'خطأ');
      sessionStorage.setItem('mabeet_key', key); files = j.files;
      $('login').classList.add('hidden'); $('list').classList.remove('hidden'); $('settings').classList.remove('hidden');
      files.sort((a,b)=>a.ts-b.ts); // الأقدم أولاً: أول من سلّم هو رقم 1
      $('count').textContent = `عدد التعهدات: ${files.length}`;
      renderGroups(); updateBtn();
    }catch(e){ status(st,'فشل الدخول: '+e.message,'err'); }
  }
  function renderGroups(){
    const groups = {};
    files.forEach((f,i)=>{ const day=f.created.slice(0,10); (groups[day]=groups[day]||[]).push(i); });
    const days = Object.keys(groups).sort();
    let n = 0;
    $('groups').innerHTML = days.map((day,gi)=>`<details class="group" ${gi===days.length-1?'open':''}>
      <summary><input type="checkbox" class="gall" data-day="${day}" title="تحديد الكل"> ${day} <span class="hint">(${groups[day].length})</span><span class="arrow">▾</span></summary>
      <table><thead><tr><th></th><th>#</th><th>الطالب</th><th>ولي الأمر</th><th>الهاتف</th><th>الوقت</th></tr></thead><tbody>
      ${groups[day].map(i=>{ const f=files[i]; n++; return `<tr><td><input type="checkbox" class="pick" data-i="${i}" data-day="${day}"></td><td>${n}</td><td>${esc(f.student)}</td><td>${esc(f.guardian)}</td><td dir="ltr">${esc(f.phone)}</td><td>${esc(f.created.slice(11))}</td></tr>`; }).join('')}
      </tbody></table></details>`).join('') || '<p class="hint">لا توجد تعهدات بعد</p>';
  }
  $('groups').addEventListener('click', e=>{ if(e.target.matches('.gall')) e.stopPropagation(); });
  $('groups').addEventListener('change', e=>{
    if(e.target.matches('.gall')){ document.querySelectorAll(`.pick[data-day="${e.target.dataset.day}"]`).forEach(c=>c.checked=e.target.checked); }
    else if(e.target.matches('.pick')){ const d=e.target.dataset.day; const all=[...document.querySelectorAll(`.pick[data-day="${d}"]`)]; document.querySelector(`.gall[data-day="${d}"]`).checked = all.every(c=>c.checked); }
    updateBtn();
  });
  const picked=()=>[...document.querySelectorAll('.pick:checked')].map(c=>files[+c.dataset.i]);
  function updateBtn(){ const n=picked().length; $('pdfBtn').disabled=!n; $('pdfBtn').textContent=`تنزيل الملف (${n})`; }
  $('loginBtn').onclick=()=>{ key=$('key').value.trim(); load(); };
  $('key').addEventListener('keydown',e=>{ if(e.key==='Enter') $('loginBtn').click(); });
  $('refresh').onclick=load;

  const loadImg = src => new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=src; });
  // التعهدات القديمة حُفظت كصفحة كاملة (طولية)؛ نقصّ منها مربع التوقيع فقط
  function extractSig(img){
    if(img.width >= img.height) return img;
    const k = img.width/1240, c = document.createElement('canvas');
    const sx=120*k, sy=1065*k, sw=440*k, sh=210*k;
    c.width = sw; c.height = sh;
    c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    return c;
  }

  $('pdfBtn').onclick=async()=>{
    const sel = picked(); if(!sel.length) return;
    const S = {mosque:$('s_mosque').value.trim(), day:$('s_day').value, date:$('s_date').value};
    if(!S.mosque||!S.day||!S.date){ status($('pdfStatus'),'أدخل المسجد واليوم والتاريخ أولاً','err'); return; }
    const btn=$('pdfBtn'); btn.disabled=true;
    const { jsPDF } = window.jspdf; const pdf = new jsPDF({unit:'mm',format:'a4'});
    try{
      for(let i=0;i<sel.length;i++){
        status($('pdfStatus'),`جاري تجهيز ${i+1} من ${sel.length}...`,'ok');
        const r = await fetch(`${C.SCRIPT_URL}?action=get&key=${encodeURIComponent(key)}&id=${sel[i].id}`); const j = await r.json();
        if(!j.ok) throw new Error(j.error||'تعذر جلب التوقيع');
        const sigImg = extractSig(await loadImg(j.image));
        await window.renderConsent($('page'), Object.assign({}, sel[i], S), sigImg);
        if(i>0) pdf.addPage();
        pdf.addImage($('page').toDataURL('image/jpeg',0.9),'JPEG',0,0,210,297);
      }
      pdf.save(`تعهدات-${S.date}.pdf`);
      status($('pdfStatus'),`تم تنزيل الملف (${sel.length} صفحة) ✓`,'ok');
    }catch(e){ console.error(e); status($('pdfStatus'),'حدث خطأ: '+e.message,'err'); }
    btn.disabled=false;
  };

  if(key && C.SCRIPT_URL) load();
})();
