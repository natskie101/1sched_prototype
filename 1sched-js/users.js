import {state} from './state.js';
import {esc,money,get} from './utils.js';

function splitName(fullName=''){ 
  const parts=(fullName || '').trim().split(/\s+/).filter(Boolean);
  if(!parts.length) return {firstName:'',middleName:'',lastName:''};
  if(parts.length===1) return {firstName:parts[0],middleName:'',lastName:''};
  if(parts.length===2) return {firstName:parts[0],middleName:'',lastName:parts[1]};
  return {firstName:parts[0],middleName:parts.slice(1,-1).join(' '),lastName:parts.at(-1)};
}

export function renderUsers(){
  get('content').innerHTML=`<div class="users-page"><div class="card user-table-card"><div class="section-head user-head"><h3>User Management</h3><button class="btn primary" onclick="openUserModal()"><i class="fa-solid fa-plus"></i> Add Instructor</button></div><div class="table-wrap"><table class="table user-table"><thead><tr><th>User ID</th><th>Full Name</th><th>Email Address</th><th>Role</th><th>Department / Section</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead><tbody>${state.users.map((u,index)=>{
    const userId = (u.employeeId || `USR-${String(index+1).padStart(3,'0')}`).toUpperCase();
    const email = u.email || `${u.name.toLowerCase().replace(/\s+/g,'.')}@clinictrack.edu`;
    const lastLogin = u.lastLogin || 'Sep 18, 2026 02:14 PM';
    return `<tr><td>${esc(userId)}</td><td>${esc(u.name)}</td><td>${esc(email)}</td><td><span class="badge blue">${esc(u.role)}</span></td><td>${esc(u.dept)}</td><td><span class="badge green">${esc(u.status)}</span></td><td>${esc(lastLogin)}</td><td><div class="user-actions"><button class="btn sm user-action-btn" onclick="openUserModal(${u.id})">Edit</button><button class="btn sm danger" onclick="deleteUser(${u.id})">Delete</button></div></td></tr>`;
  }).join('')}</tbody></table></div></div></div>`;
}
export function openUserModal(userId = null){
  const user = userId !== null ? state.users.find(u => u.id === Number(userId)) : null;
  const isEdit = !!user;
  const {firstName,middleName,lastName} = splitName(user?.name || '');
  const email = user?.email || `${(firstName || 'user').toLowerCase()}.${(lastName || 'profile').toLowerCase()}@clinictrack.edu`;
  const dept = user?.dept || 'BS Nursing';
  const role = user?.role || 'INSTRUCTOR';
  const title = user?.title || 'RN, MAN, PhD';
  const phone = user?.phone || '';
  const employeeId = user?.employeeId || '';

  get('modalTitle').textContent = isEdit ? 'Edit Instructor' : 'Add Instructor';
  get('modalBody').innerHTML=`<div class="user-form"><input type="hidden" id="uUserId" value="${user ? user.id : ''}"><div class="user-form-section"><div class="user-form-title">1. Personal &amp; Identification Details</div><div class="user-form-grid"><div class="field"><label>First Name <span>*</span></label><input id="uFirstName" value="${esc(firstName)}"></div><div class="field"><label>Last Name <span>*</span></label><input id="uLastName" value="${esc(lastName)}"></div><div class="field"><label>Middle Name</label><input id="uMiddleName" value="${esc(middleName)}"></div><div class="field"><label>Title / Credentials</label><input id="uTitle" value="${esc(title)}"></div><div class="field full-width"><label>Institutional Email Address <span>*</span></label><input id="uEmail" value="${esc(email)}" placeholder="e.g. username@clinictrack.edu"></div><div class="field"><label>Phone Number <span>*</span></label><input id="uPhone" value="${esc(phone)}"></div><div class="field"><label>Employee / Instructor ID <span>*</span></label><input id="uEmployeeId" value="${esc(employeeId)}" placeholder="EMP-2026-001"></div><div class="field"><label>Primary Department / College <span>*</span></label><select id="uDept"><option ${dept==='BS Nursing' ? 'selected' : ''}>BS Nursing</option><option ${dept==='BS Midwifery' ? 'selected' : ''}>BS Midwifery</option><option ${dept==='ADMINISTRATION' || dept==='Administration' ? 'selected' : ''}>Administration</option></select></div><div class="field full-width"><label>Primary System Role <span>*</span></label><div class="radio-group"><label class="radio-option"><input type="radio" name="uRoleRadio" value="ADMIN" ${role==='ADMIN' ? 'checked' : ''}> <span>System Administrator</span></label><label class="radio-option"><input type="radio" name="uRoleRadio" value="INSTRUCTOR" ${role==='INSTRUCTOR' ? 'checked' : ''}> <span>Instructor</span></label></div></div></div></div><div class="modal-actions"><button class="btn" type="button" onclick="closeModal()">Cancel</button><button class="btn primary" type="button" onclick="saveUser()">${isEdit ? 'Save Changes' : 'Add User'}</button></div></div>`;
  get('modal').classList.remove('hidden');
}
export function saveUser(){
  const userId = get('uUserId')?.value ? Number(get('uUserId').value) : null;
  const existingUser = userId !== null ? state.users.find(u => u.id === userId) : null;
  const firstName=get('uFirstName')?.value.trim() || '';
  const lastName=get('uLastName')?.value.trim() || '';
  const middleName=get('uMiddleName')?.value.trim() || '';
  const name=[firstName,lastName].filter(Boolean).join(' ');
  if(!name) return alert('Enter a name.');
  const dept=get('uDept').value;
  const selectedRole=document.querySelector('input[name="uRoleRadio"]:checked')?.value || 'INSTRUCTOR';
  const email=get('uEmail')?.value.trim() || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@clinictrack.edu`;
  const employeeId=get('uEmployeeId')?.value.trim() || `EMP-${Date.now()}`;
  const title=get('uTitle')?.value.trim() || 'RN, MAN, PhD';
  const phone=get('uPhone')?.value.trim() || '';
  const userRecord={
    id: existingUser ? existingUser.id : Date.now(),
    name, middleName, employeeId, role:selectedRole, dept,
    unit: dept === 'Administration' || dept === 'ADMINISTRATION' ? 'Administration' : 'Clinical Instruction & Community Health',
    rate: existingUser?.rate || 450,
    status: existingUser?.status || 'Active',
    email, phone, title,
    lastLogin: existingUser?.lastLogin || 'Sep 18, 2026 02:14 PM'
  };

  if (existingUser) {
    const index = state.users.findIndex(u => u.id === existingUser.id);
    state.users[index] = userRecord;
  } else {
    state.users.push(userRecord);
  }

  window.closeModal(); renderUsers();
}
export function deleteUser(id){
  const user = state.users.find(u => u.id === Number(id));
  if(!user) return;

  get('modalTitle').textContent='Confirm Delete';
  get('modalBody').innerHTML=`<div class="confirm-box"><div class="confirm-icon"><i class="fa-solid fa-user-slash"></i></div><div class="confirm-copy"><h4>Delete this instructor?</h4><p>This will permanently remove ${esc(user.name)} from the system and delete their profile access.</p></div></div><div class="confirm-actions"><button class="btn" type="button" onclick="closeModal()">Cancel</button><button class="btn danger" type="button" onclick="confirmDeleteUser(${user.id})">Delete Instructor</button></div>`;
  get('modal').classList.remove('hidden');
}
export function confirmDeleteUser(id){
  state.users=state.users.filter(u=>u.id!==Number(id));
  window.closeModal();
  renderUsers();
}
window.openUserModal=openUserModal; window.saveUser=saveUser; window.deleteUser=deleteUser; window.confirmDeleteUser=confirmDeleteUser;
