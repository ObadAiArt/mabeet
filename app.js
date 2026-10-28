(function(){
  const C = window.CONFIG || {};
  const $ = id => document.getElementById(id);
  const fields = ['guardian','student','mosque','day','date','phone'];
  const labels = {guardian:'اسم ولي الأمر',student:'اسم الطالب',mosque:'المسجد',day:'اليوم',date:'التاريخ',phone:'رقم التواصل'};

  // prefill from config and URL (?mosque=..&day=..&date=..)
  const q = new URLSearchParams(location.search);
  $('mosque').value = q.get('mosque') || C.DEFAULT_MOSQUE || '';
  $('day').value = q.get('day') || C.DEFAULT_DAY || '';
  $('date').value = q.get('date') || C.DEFAULT_DATE || '';
  try{ const saved = JSON.parse(localStorage.getItem('mabeet')||'{}'); ['guardian','student','phone'].forEach(k=>{ if(saved[k]) $(k).value = saved[k]; }); }catch(e){}

  // ---------- signature pad ----------
  const sig = $('sig'), sctx = sig.getContext('2d');
  let drawing = false, hasSig = false, last = null;
  function fitSig(){
    const r = sig.getBoundingClientRect(), dpr = window.devicePixelRatio||1;
    const img = hasSig ? sig.toDataURL() : null;
    sig.width = r.width*dpr; sig.height = r.height*dpr;
    sctx.setTransform(dpr,0,0,dpr,0,0);
    sctx.lineWidth = 2.5; sctx.lineCap='round'; sctx.lineJoin='round'; sctx.strokeStyle='#0b2a6b';
    if(img){ const im = new Image(); im.onload=()=>sctx.drawImage(im,0,0,r.width,r.height); im.src=img; }
  }
  fitSig(); window.addEventListener('resize', fitSig);
  const pos = e => { const r = sig.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; };
  sig.addEventListener('pointerdown', e=>{ e.preventDefault(); drawing=true; last=pos(e); sig.setPointerCapture(e.pointerId); });
  sig.addEventListener('pointermove', e=>{ if(!drawing) return; e.preventDefault(); const p=pos(e); sctx.beginPath(); sctx.moveTo(last.x,last.y); sctx.lineTo(p.x,p.y); sctx.stroke(); last=p; hasSig=true; });
  const stop = ()=>{ drawing=false; };
  sig.addEventListener('pointerup', stop); sig.addEventListener('pointercancel', stop); sig.addEventListener('pointerleave', stop);
  $('clearSig').onclick = ()=>{ sctx.clearRect(0,0,sig.width,sig.height); hasSig=false; };

  // ---------- render page ----------
  const page = $('page'), ctx = page.getContext('2d');
  const W = page.width, H = page.height;
  function fmtDate(iso){ if(!iso) return ''; const [y,m,d]=iso.split('-'); return `${d}/${m}/${y}`; }

  function underlined(text, x, y, minW){
    // draws value with a line under it, right aligned at x, returns left edge
    const w = Math.max(ctx.measureText(text).width, minW||0);
    ctx.fillText(text, x, y);
    ctx.beginPath(); ctx.moveTo(x, y+12); ctx.lineTo(x-w, y+12); ctx.lineWidth=2; ctx.strokeStyle='#333'; ctx.stroke();
    return x - w;
  }
  function label(text, x, y){ ctx.fillText(text, x, y); return x - ctx.measureText(text).width; }

  async function render(d){
    await document.fonts.ready;
    const F = '"Noto Naskh Arabic","Amiri","Simplified Arabic",serif';
    ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#000'; ctx.direction='rtl'; ctx.textAlign='right'; ctx.textBaseline='alphabetic';
    const M = 110, R = W-M;
    // frame
    ctx.strokeStyle='#1d5c3f'; ctx.lineWidth=4; ctx.strokeRect(50,50,W-100,H-100);

    ctx.textAlign='center';
    ctx.font = `700 42px ${F}`; ctx.fillText('بسم الله الرحمن الرحيم', W/2, 190);
    ctx.font = `700 56px ${F}`; ctx.fillText('تعهد ولي الأمر', W/2, 300);
    ctx.beginPath(); ctx.moveTo(W/2-160,325); ctx.lineTo(W/2+160,325); ctx.lineWidth=3; ctx.strokeStyle='#1d5c3f'; ctx.stroke();

    ctx.textAlign='right'; ctx.font = `400 36px ${F}`;
    let y = 470, x;
    x = label('أنا الموقع أدناه: ', R, y); x = underlined(d.guardian, x-10, y, 380);
    y += 95; x = label('ولي أمر الطالب: ', R, y); x = underlined(d.student, x-10, y, 380);
    y += 95; x = label('لا مانع لدينا من مشاركة الطالب: ', R, y); x = underlined(d.student, x-10, y, 380);
    y += 95; x = label('في نشاط الاعتكاف المقام في مسجد: ', R, y); x = underlined(d.mosque, x-10, y, 340);
    y += 95; x = label('يوم: ', R, y); x = underlined(d.day, x-10, y, 180); x = label('الموافق: ', x-50, y); underlined(fmtDate(d.date)+' م', x-10, y, 260);
    y += 95; x = label('رقم التواصل: ', R, y); underlined(d.phone, x-10, y, 300);

    y += 150;
    ctx.font = `700 36px ${F}`;
    ctx.fillText('اسم ولي الأمر وتوقيعه:', R, y);
    ctx.font = `400 36px ${F}`;
    ctx.fillText(d.guardian, R, y+70);
    // signature box
    const bw = 460, bh = 230, bx = M, by = y - 40;
    ctx.strokeStyle='#999'; ctx.lineWidth=2; ctx.setLineDash([10,8]); ctx.strokeRect(bx, by, bw, bh); ctx.setLineDash([]);
    const iw = bw-20, ih = bh-20, sc = Math.min(iw/sig.width, ih/sig.height);
    const dw = sig.width*sc, dh = sig.height*sc;
    ctx.drawImage(sig, bx+10+(iw-dw)/2, by+10+(ih-dh)/2, dw, dh);

    ctx.font = `400 26px ${F}`; ctx.fillStyle='#666'; ctx.textAlign='center';
    ctx.fillText('تم إعداد هذا التعهد إلكترونياً بتاريخ ' + new Date().toLocaleDateString('ar-SY-u-nu-latn') , W/2, H-120);
  }

  // ---------- flow ----------
  let pdfBlob = null, fileName = '';
  function status(el, msg, cls){ el.textContent = msg; el.className = 'status ' + (cls||''); }

  $('makeBtn').onclick = async ()=>{
    const d = {}; for(const k of fields) d[k] = $(k).value.trim();
    const missing = fields.filter(k=>!d[k]);
    if(missing.length){ status($('formStatus'), 'يرجى تعبئة: ' + missing.map(k=>labels[k]).join('، '), 'err'); return; }
    if(!hasSig){ status($('formStatus'), 'يرجى التوقيع داخل الإطار', 'err'); return; }
    status($('formStatus'), '', '');
    try{ localStorage.setItem('mabeet', JSON.stringify({guardian:d.guardian,student:d.student,phone:d.phone})); }catch(e){}
    $('makeBtn').disabled = true; $('makeBtn').textContent = 'جاري التجهيز...';
    try{
      await render(d);
      const img = page.toDataURL('image/jpeg', 0.92);
      $('preview').src = img;
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({unit:'mm', format:'a4'});
      pdf.addImage(img, 'JPEG', 0, 0, 210, 297);
      pdfBlob = pdf.output('blob');
      fileName = 'تعهد-' + d.student.replace(/\s+/g,'-') + '.pdf';
      $('formCard').classList.add('hidden'); $('resultCard').classList.remove('hidden');
      window.scrollTo({top:0,behavior:'smooth'});
      upload(d, img);
      await share();
    }catch(e){ console.error(e); status($('formStatus'), 'حدث خطأ، حاول مرة أخرى', 'err'); }
    $('makeBtn').disabled = false; $('makeBtn').textContent = 'إرسال عبر واتساب';
  };

  async function upload(d, img){
    const st = $('saveStatus');
    if(!C.SCRIPT_URL){ st.className='status'; return; }
    status(st, 'جاري حفظ نسخة لدى المسؤول...', 'ok');
    try{
      const res = await fetch(C.SCRIPT_URL, {method:'POST', body: JSON.stringify({action:'save', data:d, image:img})});
      const j = await res.json();
      if(j.ok) status(st, 'تم حفظ نسخة لدى المسؤول بنجاح ✓', 'ok'); else throw new Error(j.error||'');
    }catch(e){ console.error(e); status(st, 'لم يتم حفظ النسخة لدى المسؤول، يرجى إرسال الملف عبر واتساب', 'err'); }
  }

  function download(){
    const a = document.createElement('a'); a.href = URL.createObjectURL(pdfBlob); a.download = fileName; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  $('downloadBtn').onclick = download;

  async function share(){
    const file = new File([pdfBlob], fileName, {type:'application/pdf'});
    if(navigator.canShare && navigator.canShare({files:[file]})){
      try{ await navigator.share({files:[file], title:'تعهد ولي الأمر'}); return; }catch(e){ if(e.name==='AbortError') return; }
    }
    download();
    const txt = encodeURIComponent('تعهد ولي الأمر — تم تنزيل الملف على الجهاز، أرفقه هنا من فضلك.');
    const url = C.ADMIN_WHATSAPP ? `https://wa.me/${C.ADMIN_WHATSAPP}?text=${txt}` : `https://wa.me/?text=${txt}`;
    setTimeout(()=>{ location.href = url; }, 800);
  }
  $('shareBtn').onclick = share;
  $('backBtn').onclick = ()=>{ $('resultCard').classList.add('hidden'); $('formCard').classList.remove('hidden'); };
})();
