import './auth.js';
import {state} from './state.js';
import {get} from './utils.js';
import {renderDashboard} from './dashboard.js';
import {renderUsers} from './users.js';
import {renderSchedules} from './schedules.js';
import {renderConflicts,runConflictCheck} from './conflicts.js';
import {renderSalaryReport} from './salary.js';

const pages={
  dashboard:{title:'Dashboard',subtitle:'Academic Year 2026-2027',render:renderDashboard},
  users:{title:'User Management',subtitle:'Manage system users and instructor profiles',render:renderUsers},
  schedules:{title:'Actual Schedule',subtitle:'Create and manage academic and clinical duties',render:renderSchedules},
  conflicts:{title:'Schedule Conflicts',subtitle:'Review detected scheduling conflicts',render:renderConflicts},
  salary:{title:'Salary Report',subtitle:'Monthly instructor duty and salary report',render:renderSalaryReport}
};

export function showPage(page){
  const config=pages[page]||pages.dashboard;
  const isScheduleGroup=page==='schedules'||page==='conflicts';
  document.querySelectorAll('.nav button[data-page]').forEach(button=>button.classList.toggle('active',button.dataset.page===page));
  const parent=document.querySelector('.nav-parent[data-parent="schedules"]');
  if(parent){
    parent.classList.toggle('active',isScheduleGroup);
    parent.classList.add('expanded');
    const subnav=document.getElementById('scheduleSubnav');
    if(subnav) subnav.classList.add('open');
  }
  get('pageTitle').textContent=config.title;
  get('pageSubtitle').textContent=config.subtitle;
  if(page!=='conflicts') runConflictCheck();
  config.render();
}
window.toggleScheduleMenu=function(force){
  const subnav=document.getElementById('scheduleSubnav');
  const parent=document.querySelector('.nav-parent[data-parent="schedules"]');
  if(!subnav||!parent)return;
  const shouldOpen=typeof force==='boolean'?force:!subnav.classList.contains('open');
  subnav.classList.toggle('open',shouldOpen);
  parent.classList.toggle('expanded',shouldOpen);
};
export function closeModal(){
  const modal = get('modal');
  modal.classList.add('hidden');
  modal.classList.remove('assignment-modal');
  modal.querySelector('.assignment-modal-icon')?.remove();
  modal.querySelector('.assignment-modal-subtitle')?.remove();
  modal.querySelector('.modal-kicker').textContent = '1SCHED';
}
window.showPage=showPage;
window.closeModal=closeModal;

get('modal').addEventListener('click',event=>{if(event.target.id==='modal')closeModal();});
runConflictCheck();
