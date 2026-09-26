import {state} from './state.js';
import {esc,get} from './utils.js';
import {findConflicts,runConflictCheck} from './conflicts.js';

function uniqueScheduleValues(key){
  return [...new Set((state.schedules || []).map(x => x[key]).filter(Boolean))].sort();
}

function normalizeScheduleInstructors(schedule){
  const direct = Array.isArray(schedule?.instructors) ? schedule.instructors.filter(Boolean) : [];
  const legacy = schedule && schedule.instructor && schedule.instructor !== 'Unassigned' ? [schedule.instructor] : [];
  return [...new Set([...direct, ...legacy])];
}

function scheduleInstructorCell(schedule){
  const names = normalizeScheduleInstructors(schedule);
  if (!names.length) return '<span class="badge amber">Unassigned</span>';
  return names.map((name, index) => `<span class="badge">${index + 1}. ${esc(name)}</span>`).join(' ');
}

function getInstructorFieldIds(){
  return ['fInstructor1', 'fInstructor2', 'fInstructor3'];
}

function getInstructorFieldValues(){
  return getInstructorFieldIds()
    .map(id => get(id)?.value || '')
    .map(value => value.trim())
    .filter(Boolean);
}

function dedupeInstructorValues(values){
  const seen = new Set();
  return values.filter(value => {
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function clearDuplicateInstructorFields(){
  const seen = new Set();
  getInstructorFieldIds().forEach(id => {
    const field = get(id);
    if (!field) return;
    const value = (field.value || '').trim();
    if (!value) return;
    if (seen.has(value)) {
      field.value = '';
      return;
    }
    seen.add(value);
  });
}

function renderInstructorSearchFields(selectedNames=[]){
  const instructorNames = state.users.filter(u => u.role === 'INSTRUCTOR').map(u => u.name);
  const values = ['Instructor 1', 'Instructor 2', 'Instructor 3'];

  return `
    <div class="field" style="grid-column:1 / -1;">
      <label>Assigned Instructors</label>
      <div class="multi-search-stack" style="display:grid; gap: 12px; margin-top: 8px;">
        ${values.map((label, index) => {
          const value = selectedNames[index] || '';
          return `
            <div class="field">
              <label>${label}</label>
              <input id="fInstructor${index + 1}" list="instructorSearchOptions" value="${esc(value)}" placeholder="Search instructor..." style="width:100%;">
            </div>
          `;
        }).join('')}
      </div>
      <datalist id="instructorSearchOptions">${instructorNames.map(name => `<option value="${esc(name)}"></option>`).join('')}</datalist>
    </div>
  `;
}

function scheduleTable(rows,actions=true){
  if(!rows.length)return '<div class="empty">No schedules found.</div>';
  return `<div class="table-wrap schedule-data-table"><table class="table schedule-table"><thead><tr><th>Exp No.</th><th>Date</th><th>Days Inclusive</th><th>Clinical Area</th><th>Program</th><th>Section</th><th>Group</th><th>Students</th><th>Instructor</th><th>Duty Time</th><th>Remarks</th>${actions?'<th>Actions</th>':''}</tr></thead><tbody>${rows.map((x,index)=>`<tr><td><span class="exp-tag">Exp ${String(index+1).padStart(2,'0')}</span></td><td>${esc(x.date)}</td><td>${esc(x.daysInclusive || '—')}</td><td>${esc(x.area)}</td><td>${esc(x.program)}</td><td>${esc(x.section || 'Sec A')}</td><td>${esc(x.group)}</td><td>${Number(x.students)||0}</td><td>${scheduleInstructorCell(x)}</td><td>${esc(x.start)}-${esc(x.end)}</td><td>${esc(x.remarks || '—')}</td>${actions?`<td><div class="actions"><button class="btn sm" onclick="assignInstructor(${x.id})">${normalizeScheduleInstructors(x).length?'Edit':'Assign'}</button><button class="btn sm danger" onclick="deleteSchedule(${x.id})">Delete</button></div></td>`:''}</tr>`).join('')}</tbody></table></div>`;
}

export function renderSchedules(){
  const programs=['All', ...uniqueScheduleValues('program')];
  const years=['All', ...uniqueScheduleValues('year')];
  get('content').innerHTML=`<div class="schedules-page"><div class="card"><div class="section-head"><h3>Clinical & Academic Schedules</h3><div class="toolbar schedule-toolbar"><input class="search" id="scheduleSearch" placeholder="Search schedules..." oninput="filterSchedules()"><div class="schedule-filters"><select class="filter-select" id="scheduleProgramFilter" onchange="filterSchedules()"><option value="All">All Programs</option>${programs.filter(p=>p!=='All').map(p=>`<option value="${esc(p)}">${esc(p)}</option>`).join('')}</select><select class="filter-select" id="scheduleYearFilter" onchange="filterSchedules()"><option value="All">All Years</option>${years.filter(y=>y!=='All').map(y=>`<option value="${esc(y)}">Year ${esc(y)}</option>`).join('')}</select></div><button class="btn primary" onclick="openScheduleModal()"><i class="fa-solid fa-plus"></i> Add Schedule</button></div></div><div id="scheduleTable">${scheduleTable(state.schedules)}</div></div></div>`;
}

export function filterSchedules(){
  const q=(get('scheduleSearch')?.value || '').toLowerCase();
  const program=(get('scheduleProgramFilter')?.value || 'All');
  const year=(get('scheduleYearFilter')?.value || 'All');

  const rows = state.schedules.filter(x => {
    const text = Object.values(x).join(' ').toLowerCase();
    const matchesText = text.includes(q);
    const matchesProgram = program === 'All' || x.program === program;
    const matchesYear = year === 'All' || x.year === year;
    return matchesText && matchesProgram && matchesYear;
  });

  get('scheduleTable').innerHTML = scheduleTable(rows);
}

export function renderCalendar(){
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  let cells=days.map(d=>`<div class="cal-head">${d}</div>`).join('');
  for(let i=1;i<=30;i++){
    const ev=state.schedules.filter(x=>Number(x.date.slice(-2))===i).slice(0,2);
    cells+=`<div class="cal-cell"><div class="date">${i}</div>${ev.map(x=>`<div class="event">${esc(x.program)} · ${esc(normalizeScheduleInstructors(x).join(', ') || 'Unassigned')}</div>`).join('')}</div>`;
  }
  return `<div class="calendar">${cells}</div>`;
}

export function openScheduleModal(){
  get('modalTitle').textContent='Add New Schedule';
  get('modalBody').innerHTML=`<div class="form-grid"><div class="field"><label>Date</label><input id="fDate" type="date" value="2026-09-24"></div><div class="field"><label>Days Inclusive</label><input id="fDaysInclusive" value="MTW" placeholder="e.g. MTW"></div><div class="field"><label>Clinical Area</label><input id="fArea" value="D.O. Plaza Memorial Hospital"></div><div class="field"><label>Program</label><select id="fProgram"><option>BS NURSING</option><option>BS MIDWIFERY</option></select></div><div class="field"><label>Year Level</label><select id="fYear"><option value="4">4</option><option value="3">3</option><option value="2">2</option><option value="1">1</option></select></div><div class="field"><label>Section</label><input id="fSection" value="Sec A"></div><div class="field"><label>Group</label><input id="fGroup" value="Group 1"></div><div class="field"><label>Students</label><input id="fStudents" type="number" value="10"></div><div class="field"><label>Room / Area</label><input id="fRoom" value="Ward A"></div><div class="field"><label>Start Time</label><input id="fStart" type="time" value="06:00"></div><div class="field"><label>End Time</label><input id="fEnd" type="time" value="14:00"></div><div class="field"><label>Duty Type</label><select id="fType"><option>Clinical Duty</option><option>Community Duty</option><option>Academic Duty</option><option>Special Duty</option></select></div><div class="field"><label>Remarks</label><input id="fRemarks" value="" placeholder="e.g. DUE"></div>${renderInstructorSearchFields([])}</div><br><button class="btn primary" onclick="saveSchedule()">Create Schedule</button>`;
  get('modal').classList.remove('hidden');
  setTimeout(() => {
    getInstructorFieldIds().forEach(id => {
      const field = get(id);
      if (field) {
        field.oninput = () => {
          clearDuplicateInstructorFields();
        };
      }
    });
  }, 0);
}

export function saveSchedule(){
  clearDuplicateInstructorFields();
  const selectedInstructors = dedupeInstructorValues(getInstructorFieldValues());
  const x={id:Date.now(),date:get('fDate').value,daysInclusive:(get('fDaysInclusive')?.value || '').trim(),area:get('fArea').value.trim(),program:get('fProgram').value,year:get('fYear').value,section:get('fSection').value.trim(),group:get('fGroup').value.trim(),students:Number(get('fStudents').value)||0,instructor:selectedInstructors[0] || 'Unassigned',instructors:selectedInstructors,start:get('fStart').value,end:get('fEnd').value,room:get('fRoom').value.trim(),type:get('fType').value,remarks:(get('fRemarks')?.value || '').trim()};
  if(!x.date||!x.area||!x.start||!x.end) return alert('Please complete the required schedule fields.');
  state.schedules.push(x);runConflictCheck();window.closeModal();window.showPage('schedules');
}

export function deleteSchedule(id){
  const schedule = state.schedules.find(x => x.id === Number(id));
  if(!schedule) return;

  get('modalTitle').textContent='Confirm Delete';
  get('modalBody').innerHTML=`<div class="confirm-box"><div class="confirm-icon"><i class="fa-solid fa-trash-can"></i></div><div class="confirm-copy"><h4>Delete this schedule?</h4><p>This will permanently remove the ${esc(schedule.program)} ${esc(schedule.group)} duty on ${esc(schedule.date)} from the schedule list.</p></div></div><div class="confirm-actions"><button class="btn" type="button" onclick="closeModal()">Cancel</button><button class="btn danger" type="button" onclick="confirmDeleteSchedule(${schedule.id})">Delete Schedule</button></div>`;
  get('modal').classList.remove('hidden');
}

export function confirmDeleteSchedule(id){
  state.schedules=state.schedules.filter(x=>x.id!==Number(id));
  runConflictCheck();
  closeModal();
  renderSchedules();
}

export function assignInstructor(id){
  const s=state.schedules.find(x=>x.id===id);
  const selectedNames = normalizeScheduleInstructors(s);
  const hasCurrent = selectedNames.length > 0;

  get('modalTitle').textContent='Edit Schedule';
  get('modalBody').innerHTML=`<div class="form-grid"><div class="field"><label>Date</label><input id="fDate" type="date" value="${esc(s.date)}"></div><div class="field"><label>Days Inclusive</label><input id="fDaysInclusive" value="${esc(s.daysInclusive || '')}" placeholder="e.g. MTW"></div><div class="field"><label>Clinical Area</label><input id="fArea" value="${esc(s.area)}"></div><div class="field"><label>Program</label><select id="fProgram"><option ${s.program==='BS NURSING'?'selected':''}>BS NURSING</option><option ${s.program==='BS MIDWIFERY'?'selected':''}>BS MIDWIFERY</option></select></div><div class="field"><label>Year Level</label><select id="fYear"><option value="4" ${s.year==='4'?'selected':''}>4</option><option value="3" ${s.year==='3'?'selected':''}>3</option><option value="2" ${s.year==='2'?'selected':''}>2</option><option value="1" ${s.year==='1'?'selected':''}>1</option></select></div><div class="field"><label>Section</label><input id="fSection" value="${esc(s.section || 'Sec A')}"></div><div class="field"><label>Group</label><input id="fGroup" value="${esc(s.group)}"></div><div class="field"><label>Students</label><input id="fStudents" type="number" value="${Number(s.students)||0}"></div><div class="field"><label>Room / Area</label><input id="fRoom" value="${esc(s.room || '')}"></div><div class="field"><label>Start Time</label><input id="fStart" type="time" value="${esc(s.start)}"></div><div class="field"><label>End Time</label><input id="fEnd" type="time" value="${esc(s.end)}"></div><div class="field"><label>Duty Type</label><select id="fType"><option ${s.type==='Clinical Duty'?'selected':''}>Clinical Duty</option><option ${s.type==='Community Duty'?'selected':''}>Community Duty</option><option ${s.type==='Academic Duty'?'selected':''}>Academic Duty</option><option ${s.type==='Special Duty'?'selected':''}>Special Duty</option></select></div><div class="field"><label>Remarks</label><input id="fRemarks" value="${esc(s.remarks || '')}" placeholder="e.g. DUE"></div>${renderInstructorSearchFields(selectedNames)}</div><br><div id="assignCheck" class="card">Select one or more instructors to verify assignment conflicts.</div><br><button class="btn primary" onclick="confirmAssign(${id})">Save Changes</button>${hasCurrent?`<button class="btn warning" onclick="removeAssignment(${id})">Remove Assignment</button>`:''}`;
  get('modal').classList.remove('hidden');
  setTimeout(()=>{
    const date=get('fDate'); const area=get('fArea'); const program=get('fProgram'); const year=get('fYear'); const section=get('fSection'); const group=get('fGroup'); const students=get('fStudents'); const room=get('fRoom'); const start=get('fStart'); const end=get('fEnd'); const type=get('fType');
    getInstructorFieldIds().forEach(idName => {
      const field = get(idName);
      if (field) field.oninput = () => {
        clearDuplicateInstructorFields();
        previewAssignment(id);
      };
    });
    previewAssignment(id);
    if(date) date.onchange=()=>previewAssignment(id);
    [area,program,year,section,group,students,room,start,end,type].forEach(el=>{ if(el){ el.oninput = ()=> previewAssignment(id); el.onchange = ()=> previewAssignment(id); } });
  },0);
}

export function previewAssignment(id){
  const s=state.schedules.find(x=>x.id===id);
  const names = dedupeInstructorValues(getInstructorFieldValues());
  const box=get('assignCheck');

  if (!names.length) {
    box.innerHTML='<strong class="success-text">No instructor assigned.</strong>';
    return;
  }

  const conflicts = names.flatMap(name => {
    const draft = {...s, instructor:name, date:get('fDate')?.value || s.date, area:get('fArea')?.value || s.area, program:get('fProgram')?.value || s.program, year:get('fYear')?.value || s.year, section:get('fSection')?.value || s.section, group:get('fGroup')?.value || s.group, students:Number(get('fStudents')?.value || s.students || 0), start:get('fStart')?.value || s.start, end:get('fEnd')?.value || s.end, type:get('fType')?.value || s.type};
    return findConflicts(draft, id).map(c => ({...c, instructor: name}));
  });

  const unique = [...new Map(conflicts.map(item => [`${item.message}|${item.type}|${item.instructor}`, item])).values()];
  box.innerHTML = unique.length ? `<strong class="danger-text">${unique.length} conflict(s) detected</strong><ul>${unique.map(c => `<li>${esc(c.instructor)}: ${esc(c.message)}</li>`).join('')}</ul>` : '<strong class="success-text">No instructor conflict detected.</strong>';
}

export function confirmAssign(id){
  const s=state.schedules.find(x=>x.id===id);
  if(!s) return;
  clearDuplicateInstructorFields();
  const selectedInstructors = dedupeInstructorValues(getInstructorFieldValues());
  s.date=get('fDate').value;
  s.daysInclusive=(get('fDaysInclusive')?.value || '').trim();
  s.area=get('fArea').value.trim();
  s.program=get('fProgram').value;
  s.year=get('fYear').value;
  s.section=get('fSection').value.trim();
  s.group=get('fGroup').value.trim();
  s.students=Number(get('fStudents').value)||0;
  s.room=get('fRoom').value.trim();
  s.start=get('fStart').value;
  s.end=get('fEnd').value;
  s.type=get('fType').value;
  s.remarks=(get('fRemarks')?.value || '').trim();
  s.instructors = selectedInstructors;
  s.instructor = selectedInstructors[0] || 'Unassigned';
  runConflictCheck();window.closeModal();window.showPage('schedules');
}

export function removeAssignment(id){
  const s=state.schedules.find(x=>x.id===id);
  if(!s) return;
  s.instructors = [];
  s.instructor='Unassigned';
  runConflictCheck();window.closeModal();window.showPage('schedules');
}

window.filterSchedules=filterSchedules;window.openScheduleModal=openScheduleModal;window.saveSchedule=saveSchedule;window.deleteSchedule=deleteSchedule;window.confirmDeleteSchedule=confirmDeleteSchedule;window.assignInstructor=assignInstructor;window.previewAssignment=previewAssignment;window.confirmAssign=confirmAssign;window.removeAssignment=removeAssignment;
