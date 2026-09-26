import {state} from './state.js';
import {esc,hours,overlap,get} from './utils.js';

export function findConflicts(s,ignoreId){
  const conflicts=[];
  state.schedules.filter(x=>x.id!==ignoreId).forEach(o=>{
    if(o.instructor===s.instructor && o.date===s.date && overlap(s.start,s.end,o.start,o.end)) conflicts.push({type:'Double-Booked',message:`${s.instructor} already has a duty from ${o.start}-${o.end}.`});
    if(o.date===s.date && o.room===s.room && overlap(s.start,s.end,o.start,o.end)) conflicts.push({type:'Room Conflict',message:`${s.room} is already used by ${o.program} ${o.group}.`});
    if(o.date===s.date && o.program===s.program && o.group===s.group && overlap(s.start,s.end,o.start,o.end)) conflicts.push({type:'Cohort Overlap',message:`${s.program} ${s.group} has an overlapping duty.`});
  });
  if(s.instructor==='Unassigned') conflicts.push({type:'Unassigned',message:'No instructor has been assigned.'});
  if(hours(s.start,s.end)>12) conflicts.push({type:'Workload Limit',message:'Duty exceeds 12 hours.'});
  return conflicts;
}
export function runConflictCheck(){
  state.conflicts=[];
  const resolvedIds = state.resolvedConflictIds || [];
  state.schedules.forEach(s=>{
    if (resolvedIds.includes(s.id)) return;
    findConflicts(s,s.id).forEach(c=>state.conflicts.push({...c,scheduleId:s.id,date:s.date,area:s.area,instructor:s.instructor}));
  });
}
export function reviewConflict(scheduleId){
  if (typeof window.assignInstructor === 'function') {
    window.assignInstructor(scheduleId);
    return;
  }
  if (typeof window.showPage === 'function') window.showPage('schedules');
}
export function resolveConflict(scheduleId){
  if (!scheduleId && scheduleId !== 0) return;
  state.resolvedConflictIds = Array.from(new Set([...(state.resolvedConflictIds || []), Number(scheduleId)]));
  const target = state.schedules.find(s => s.id === Number(scheduleId));
  if (target) {
    target.instructor = 'Unassigned';
  }
  runConflictCheck();
  renderConflicts();
}
export function renderConflicts(){
  runConflictCheck();
  const conflicts = (state.conflicts || []).filter(c => !(state.resolvedConflictIds || []).includes(c.scheduleId));
  get('content').innerHTML=`<div class="conflicts-page"><div class="card"><div class="section-head"><h3>Detected Conflicts</h3><button class="btn" onclick="refreshConflicts()"><i class="fa-solid fa-rotate"></i> Recheck</button></div>${conflicts.length?`<div class="table-wrap"><table class="table conflict-table"><thead><tr><th>Date</th><th>Type</th><th>Instructor</th><th>Clinical Area</th><th>Details</th><th>Actions</th></tr></thead><tbody>${conflicts.map(c=>`<tr><td>${esc(c.date)}</td><td><span class="badge red">${esc(c.type)}</span></td><td>${esc(c.instructor)}</td><td>${esc(c.area)}</td><td>${esc(c.message)}</td><td><div class="conflict-actions">${c.type==='Room Conflict'?`<button class="btn sm primary" type="button" onclick="reviewConflict(${c.scheduleId})">Move Room</button><button class="btn sm danger" type="button" onclick="resolveConflict(${c.scheduleId})">Reschedule</button>`:c.type==='Double-Booked'?`<button class="btn sm primary" type="button" onclick="reviewConflict(${c.scheduleId})">Reassign</button><button class="btn sm danger" type="button" onclick="resolveConflict(${c.scheduleId})">Swap</button>`:c.type==='Cohort Overlap'?`<button class="btn sm primary" type="button" onclick="reviewConflict(${c.scheduleId})">Reallocate</button><button class="btn sm danger" type="button" onclick="resolveConflict(${c.scheduleId})">Reschedule</button>`:`<button class="btn sm primary" type="button" onclick="reviewConflict(${c.scheduleId})">Review</button><button class="btn sm danger" type="button" onclick="resolveConflict(${c.scheduleId})">Resolve</button>`}</div></td></tr>`).join('')}</tbody></table></div>`:'<div class="empty"><i class="fa-solid fa-circle-check" style="font-size:30px"></i><br>No scheduling conflicts detected.</div>'}</div></div>`;
}
export function refreshConflicts(){runConflictCheck();renderConflicts();}
window.reviewConflict=reviewConflict;window.resolveConflict=resolveConflict;window.refreshConflicts=refreshConflicts;
