export function esc(value){
  return String(value ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}
export function money(value){
  return '₱' + Number(value || 0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
}
export function moneyWhole(value){
  return '₱' + Number(value || 0).toLocaleString('en-PH',{maximumFractionDigits:0});
}
export function hours(start,end){
  const [sh,sm]=start.split(':').map(Number);
  const [eh,em]=end.split(':').map(Number);
  let result=(eh*60+em-sh*60-sm)/60;
  if(result<0) result+=24;
  return result;
}
export function overlap(a,b,c,d){
  return (a<c && c<b) || (c<a && a<d) || a===c;
}
export function formatLongDate(date){
  return new Date(date+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric'});
}
export function monthName(month){
  return new Date(2000,month-1,1).toLocaleString('en-US',{month:'long'});
}
export function get(id){ return document.getElementById(id); }
