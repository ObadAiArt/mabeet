(function(){
  const C = window.CONFIG || {};
  const $ = id => document.getElementById(id);
  const fields = ['guardian','student','phone'];
  const labels = {guardian:'اسم ولي الأمر',student:'اسم الطالب',phone:'رقم التواصل'};
  try{ const saved = JSON.parse(localStorage.getItem('mabeet')||'{}'); ['guardian','phone'].forEach(k=>{ if(saved[k]) $(k).value = saved[k]; }); }catch(e){}

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
  function clearSig(){ sctx.clearRect(0,0,sig.width,sig.height); hasSig=false; }
  $('clearSig').onclick = clearSig;

  function status(msg, cls){ const el=$('formStatus'); el.textContent = msg; el.className = 'status ' + (cls||''); }

  $('submitBtn').onclick = async ()=>{
    const d = {}; for(const k of fields) d[k] = $(k).value.trim();
    const missing = fields.filter(k=>!d[k]);
    if(missing.length){ status('يرجى تعبئة: ' + missing.map(k=>labels[k]).join('، '), 'err'); return; }
    if(!hasSig){ status('يرجى التوقيع داخل الإطار', 'err'); return; }
    if(!C.SCRIPT_URL){ status('الموقع غير مهيأ بعد، تواصل مع المسؤول', 'err'); return; }
    try{ localStorage.setItem('mabeet', JSON.stringify({guardian:d.guardian,phone:d.phone})); }catch(e){}
    const btn = $('submitBtn'); btn.disabled = true; btn.textContent = 'جاري التسليم...'; status('', '');
    try{
      const res = await fetch(C.SCRIPT_URL, {method:'POST', body: JSON.stringify({action:'save', data:d, image: sig.toDataURL('image/png')})});
      const j = await res.json();
      if(!j.ok) throw new Error(j.error||'');
      $('formCard').classList.add('hidden'); $('doneCard').classList.remove('hidden'); window.scrollTo(0,0);
    }catch(e){ console.error(e); status('لم يتم التسليم، تأكد من الاتصال بالإنترنت وحاول مرة أخرى', 'err'); }
    btn.disabled = false; btn.textContent = 'تسليم';
  };
  $('againBtn').onclick = ()=>{ $('student').value=''; clearSig(); $('doneCard').classList.add('hidden'); $('formCard').classList.remove('hidden'); };
})();
