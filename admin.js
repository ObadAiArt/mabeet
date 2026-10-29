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
      $('count').textContent = `عدد التعهدات: ${files.length}`;
      $('rows').innerHTML = files.map((f,i)=>`<tr><td><input type="checkbox" class="pick" data-i="${i}" style="width:22px;height:22px"></td><td>${esc(f.student)}</td><td>${esc(f.guardian)}</td><td dir="ltr">${esc(f.phone)}</td><td>${esc(f.created)}</td></tr>`).join('') || '<tr><td colspan="5">لا توجد تعهدات بعد</td></tr>';
      $('all').checked=false; updateBtn();
    }catch(e){ status(st,'فشل الدخول: '+e.message,'err'); }
  }
  const picked=()=>[...document.querySelectorAll('.pick:checked')].map(c=>files[+c.dataset.i]);
  function updateBtn(){ const n=picked().length; $('pdfBtn').disabled=!n; $('pdfBtn').textContent=`تنزيل الملف (${n})`; }
  $('rows').addEventListener('change', updateBtn);
  $('all').onchange=()=>{ document.querySelectorAll('.pick').forEach(c=>c.checked=$('all').checked); updateBtn(); };
  $('loginBtn').onclick=()=>{ key=$('key').value.trim(); load(); };
  $('key').addEventListener('keydown',e=>{ if(e.key==='Enter') $('loginBtn').click(); });
  $('refresh').onclick=load;

  const loadImg = src => new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=rej; im.src=src; });

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
        const sigImg = await loadImg(j.image);
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
