import {state} from './state.js';
import {hours,esc,get} from './utils.js';

function scheduleTable(rows,actions=false){
  if(!rows.length) return '<div class="empty">No schedules found.</div>';
  return `<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Clinical Area</th><th>Program</th><th>Group</th><th>Instructor</th><th>Duty</th>${actions?'<th>Actions</th>':''}</tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.area)}</td><td>${esc(x.program)}</td><td>${esc(x.group)}</td><td>${x.instructor==='Unassigned'?'<span class="badge amber">Unassigned</span>':esc(x.instructor)}</td><td>${esc(x.start)}-${esc(x.end)}</td>${actions?`<td><div class="actions"><button class="btn sm" onclick="assignInstructor(${x.id})">Assign</button><button class="btn sm danger" onclick="deleteSchedule(${x.id})">Delete</button></div></td>`:''}</tr>`).join('')}</tbody></table></div>`;
}

export function renderDashboard(){
  const assigned=state.schedules.filter(x=>x.instructor!=='Unassigned').length;
  const unassigned=state.schedules.length-assigned;
  get('content').innerHTML=`
    <div class="dashboard-page"><div class="grid stats">
      <div class="card stat"><div><div class="label">TOTAL SCHEDULES</div><div class="value">${state.schedules.length}</div></div><div class="icon"><i class="fa-solid fa-calendar"></i></div></div>
      <div class="card stat"><div><div class="label">INSTRUCTORS</div><div class="value">${state.users.filter(u=>u.role==='INSTRUCTOR').length}</div></div><div class="icon"><i class="fa-solid fa-user-tie"></i></div></div>
      <div class="card stat"><div><div class="label">UNASSIGNED</div><div class="value danger-text">${unassigned}</div></div><div class="icon"><i class="fa-solid fa-user-clock"></i></div></div>
    </div>
    <br>
    <div class="grid dashboard-grid">
      <div class="card"><div class="section-head"><h3>Recent Schedules</h3><button class="btn sm" onclick="showPage('schedules')">View All</button></div>${scheduleTable(state.schedules.slice(-5).reverse())}</div>
      <div class="card"><div class="section-head"><h3>System Status</h3></div><div class="kpi-list">
        <div class="kpi-row"><span>Assigned Schedules</span><strong class="success-text">${assigned}</strong></div>
        <div class="kpi-row"><span>Unassigned</span><strong class="danger-text">${unassigned}</strong></div>
        <div class="kpi-row"><span>Conflicts</span><strong class="danger-text">${state.conflicts.length}</strong></div>
        <div class="kpi-row"><span>Salary Records</span><strong>${state.salaryRecords.length}</strong></div>
      </div></div>
    </div></div>`;
}
