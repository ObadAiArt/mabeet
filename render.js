// رسم صفحة التعهد على canvas بحجم A4 (1240×1754)
window.renderConsent = async function(canvas, d, sigImg){
  await document.fonts.ready;
  const ctx = canvas.getContext('2d'), W = canvas.width, H = canvas.height;
  const F = '"Noto Naskh Arabic","Amiri","Simplified Arabic",serif';
  const fmtDate = iso => { if(!iso) return ''; const [y,m,dd]=iso.split('-'); return `${dd}/${m}/${y}`; };
  function underlined(text, x, y, minW){
    const w = Math.max(ctx.measureText(text).width, minW||0);
    ctx.fillText(text, x, y);
    ctx.beginPath(); ctx.moveTo(x, y+12); ctx.lineTo(x-w, y+12); ctx.lineWidth=2; ctx.strokeStyle='#333'; ctx.stroke();
    return x - w;
  }
  const label = (text, x, y) => { ctx.fillText(text, x, y); return x - ctx.measureText(text).width; };

  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#000'; ctx.direction='rtl'; ctx.textAlign='right'; ctx.textBaseline='alphabetic';
  const M = 110, R = W-M;
  ctx.strokeStyle='#1d5c3f'; ctx.lineWidth=4; ctx.strokeRect(50,50,W-100,H-100);

  ctx.textAlign='center';
  ctx.font = `700 42px ${F}`; ctx.fillText('بسم الله الرحمن الرحيم', W/2, 190);
  ctx.font = `700 56px ${F}`; ctx.fillText('تعهد ولي الأمر', W/2, 300);
  ctx.beginPath(); ctx.moveTo(W/2-160,325); ctx.lineTo(W/2+160,325); ctx.lineWidth=3; ctx.strokeStyle='#1d5c3f'; ctx.stroke();

  ctx.textAlign='right'; ctx.font = `400 36px ${F}`;
  let y = 470, x;
  x = label('أنا الموقع أدناه: ', R, y); underlined(d.guardian, x-10, y, 380);
  y += 95; x = label('ولي أمر الطالب: ', R, y); underlined(d.student, x-10, y, 380);
  y += 95; x = label('لا مانع لدينا من مشاركة الطالب: ', R, y); underlined(d.student, x-10, y, 380);
  y += 95; x = label('في نشاط الاعتكاف المقام في مسجد: ', R, y); underlined(d.mosque, x-10, y, 340);
  y += 95; x = label('يوم: ', R, y); x = underlined(d.day, x-10, y, 180); x = label('الموافق: ', x-50, y); underlined(fmtDate(d.date)+' م', x-10, y, 260);
  y += 95; x = label('رقم التواصل: ', R, y); underlined(d.phone, x-10, y, 300);

  y += 150;
  ctx.font = `700 36px ${F}`; ctx.fillText('اسم ولي الأمر وتوقيعه:', R, y);
  ctx.font = `400 36px ${F}`; ctx.fillText(d.guardian, R, y+70);
  const bw = 460, bh = 230, bx = M, by = y - 40;
  ctx.strokeStyle='#999'; ctx.lineWidth=2; ctx.setLineDash([10,8]); ctx.strokeRect(bx, by, bw, bh); ctx.setLineDash([]);
  if(sigImg){
    const iw = bw-20, ih = bh-20, sc = Math.min(iw/sigImg.width, ih/sigImg.height);
    const dw = sigImg.width*sc, dh = sigImg.height*sc;
    ctx.drawImage(sigImg, bx+10+(iw-dw)/2, by+10+(ih-dh)/2, dw, dh);
  }
  ctx.font = `400 26px ${F}`; ctx.fillStyle='#666'; ctx.textAlign='center';
  ctx.fillText('تم التوقيع إلكترونياً بتاريخ ' + (d.created||''), W/2, H-120);
};
