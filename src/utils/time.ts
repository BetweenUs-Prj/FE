export function fromNow(iso: string) {
  const t = new Date(iso).getTime(); const s = Math.max(1, Math.floor((Date.now()-t)/1000));
  if (s < 60) return `${s}초 전`; const m = Math.floor(s/60);
  if (m < 60) return `${m}분 전`; const h = Math.floor(m/60);
  if (h < 24) return `${h}시간 전`; const d = Math.floor(h/24);
  if (d < 7) return `${d}일 전`; const w = Math.floor(d/7);
  if (w < 5) return `${w}주 전`; const mo = Math.floor(d/30);
  if (mo < 12) return `${mo}개월 전`; const y = Math.floor(mo/12);
  return `${y}년 전`;
}