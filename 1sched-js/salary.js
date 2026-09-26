import {state} from './state.js';
import {esc, money, moneyWhole, formatLongDate, get} from './utils.js';

const MONTHS = [
  'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'
];

const REPORT = {
  instructor: 'Dr. Arvin C. Villareal',
  employeeId: 'EMP-23142-51231',
  department: 'Clinical Instruction & Community Health',
  unit: 'College of Nursing & Midwifery',
  billingDate: 'September 1, 2026',
  status: 'APPROVED'
};

function getInstructorMatches(query = '') {
  const normalized = query.trim().toLowerCase();

  if (!normalized) {
    return state.users.slice(0, 8);
  }

  return state.users.filter(user =>
    `${user.name} ${user.employeeId} ${user.dept || ''} ${user.unit || ''}`.toLowerCase().includes(normalized)
  ).slice(0, 8);
}

function getSelectedUser() {
  const query = (get('salarySearch')?.value || '').trim().toLowerCase();
  if (query) {
    const matchedUser = state.users.find(user =>
      `${user.name} ${user.employeeId} ${user.email || ''}`.toLowerCase().includes(query)
    );
    if (matchedUser) return matchedUser;
    return null;
  }

  const instructorValue = get('salaryInstructor')?.value;
  if (instructorValue) {
    const selectedUser = state.users.find(user => String(user.id) === String(instructorValue));
    if (selectedUser) return selectedUser;
  }

  return null;
}

function toISODate(date) {
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60 * 1000);
  return adjusted.toISOString().slice(0, 10);
}

export function salaryTotal(rows) {
  return rows.reduce((sum, row) => sum + (Number(row.hours) || 0) * (Number(row.rate) || 0), 0);
}

function selectedRows() {
  const query = (get('salarySearch')?.value || '').trim().toLowerCase();
  const selectedUser = getSelectedUser();
  const startValue = get('salaryStartDate')?.value || '2026-01-01';
  const endValue = get('salaryEndDate')?.value || '2026-12-31';
  const startDate = new Date(`${startValue}T00:00:00`);
  const endDate = new Date(`${endValue}T23:59:59`);

  if (!selectedUser && !query) {
    return state.salaryRecords.filter(row => {
      const date = new Date(`${row.date}T00:00:00`);
      return date >= startDate && date <= endDate;
    });
  }

  if (!selectedUser) {
    return [];
  }

  return state.salaryRecords.filter(row => {
    const date = new Date(`${row.date}T00:00:00`);
    const matchesDate = date >= startDate && date <= endDate;
    const searchable = `${selectedUser.name} ${selectedUser.employeeId || ''} ${selectedUser.dept || ''} ${selectedUser.unit || ''}`.toLowerCase();
    const matchesUser = !query || searchable.includes(query) || !selectedUser;
    return matchesDate && matchesUser;
  });
}

function categorySummary(rows, type) {
  const group = rows.filter(row => row.remarks === type);
  const hrs = group.reduce((sum, row) => sum + Number(row.hours || 0), 0);
  const amount = group.reduce((sum, row) => sum + (Number(row.hours || 0) * Number(row.rate || 0)), 0);
  const rate = group.length ? Number(group[0].rate) : 0;
  return {type, hrs, rate, amount};
}

function renderSalaryRows(rows) {
  if (!rows.length) {
    return `<tr><td colspan="8" class="salary-empty-cell">
      <div class="salary-empty">
        <i class="fa-regular fa-folder-open"></i>
        <strong>No salary records found</strong>
        <span>Try another instructor, month, or year.</span>
      </div>
    </td></tr>`;
  }

  return rows.map(row => `
    <tr>
      <td class="salary-date">${formatLongDate(row.date)}</td>
      <td><strong>${esc(row.area)}</strong></td>
      <td>${esc(row.time)}</td>
      <td class="center">${row.hours}</td>
      <td><span class="duty-tag ${String(row.remarks).toLowerCase().replaceAll(' ', '-')}">${esc(row.remarks)}</span></td>
      <td class="right">${moneyWhole(row.rate)}</td>
      <td>${esc(row.signature || '—')}</td>
      <td>${esc(row.attestation || '—')}</td>
    </tr>
  `).join('');
}

function renderSummary(rows) {
  const categories = ['Regular Shift','Field Duty','Academic Duty','Special Duty','Overtime']
    .map(type => categorySummary(rows, type));
  const totalHours = rows.reduce((sum, row) => sum + Number(row.hours || 0), 0);
  const total = salaryTotal(rows);

  return `
    <div class="salary-summary-head">
      <div>
        <span class="eyebrow">COMPENSATION SUMMARY</span>
        <h4>Monthly Computation</h4>
      </div>
      <div class="summary-period">${rows.length} duty records · ${totalHours} total hours</div>
    </div>
    <div class="salary-summary-grid">
      ${categories.map(item => `
        <div class="summary-line">
          <div class="summary-line-name">${esc(item.type)}</div>
          <div class="summary-line-hours">${item.hrs} hrs</div>
          <div class="summary-line-amount">${money(item.amount)}</div>
        </div>
      `).join('')}
    </div>
    <div class="salary-grand-total">
      <div>
        <span>TOTAL SALARY DUE</span>
        <small>Based on verified duty hours and applicable rates</small>
      </div>
      <strong>${moneyWhole(total)}</strong>
    </div>
  `;
}

function buildReportMarkup(rows) {
  const total = salaryTotal(rows);
  const startValue = get('salaryStartDate')?.value || '2026-01-01';
  const endValue = get('salaryEndDate')?.value || '2026-12-31';
  const startDate = new Date(`${startValue}T00:00:00`);
  const endDate = new Date(`${endValue}T23:59:59`);
  const period = `${startDate.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})} – ${endDate.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}`;

  return {
    period,
    total,
    rows,
    categories: ['Regular Shift','Field Duty','Academic Duty','Special Duty','Overtime'].map(type => categorySummary(rows, type))
  };
}

function getUserRows(user) {
  if (!user) return [];

  const startValue = get('salaryStartDate')?.value || '2026-01-01';
  const endValue = get('salaryEndDate')?.value || '2026-12-31';
  const startDate = new Date(`${startValue}T00:00:00`);
  const endDate = new Date(`${endValue}T23:59:59`);
  const query = (get('salarySearch')?.value || '').trim().toLowerCase();

  return state.salaryRecords.filter(row => {
    const date = new Date(`${row.date}T00:00:00`);
    const matchesDate = date >= startDate && date <= endDate;
    const searchable = `${user.name} ${user.employeeId || ''}`.toLowerCase();
    const matchesSearch = !query || searchable.includes(query);
    return matchesDate && matchesSearch;
  });
}

function buildReportSheetMarkup(rows, reportUser) {
  const report = buildReportMarkup(rows);
  const reportName = reportUser?.name || 'All Instructors';
  const reportEmployeeId = reportUser?.employeeId || 'ALL INSTRUCTORS';
  const reportDept = reportUser?.dept || 'Multiple departments';
  const reportUnit = reportUser?.unit || 'Combined salary report';
  const totalHours = rows.reduce((sum, row) => sum + Number(row.hours || 0), 0);

  return `
    <div class="salary-report-topline"></div>

    <header class="salary-report-header">
      <div class="report-document-label">
        <span>OFFICIAL DOCUMENT</span>
        <strong>MONTHLY SALARY REPORT</strong>
        <small>${report.period}</small>
      </div>
    </header>

    <div class="salary-report-title-row">
      <div>
        <span class="eyebrow">ACADEMIC & CLINICAL OPERATIONS</span>
        <h2>Monthly Salary Report</h2>
        <p>Academic Year 2026–2027</p>
      </div>
      <div class="approval-stamp">
        <i class="fa-solid fa-circle-check"></i>
        <div><span>REPORT STATUS</span><strong>${REPORT.status}</strong></div>
      </div>
    </div>

    <div class="salary-stat-strip">
      <div><span>Duty Records</span><strong>${rows.length}</strong></div>
      <div><span>Total Duty Hours</span><strong>${totalHours}</strong></div>
      <div><span>Report Period</span><strong>${report.period}</strong></div>
      <div><span>Billing Date</span><strong>${REPORT.billingDate}</strong></div>
    </div>

    <div class="salary-information">
      <div class="information-block">
        <span>INSTRUCTOR</span>
        <strong>${reportName}</strong>
        <small>Employee ID: ${reportEmployeeId}</small>
      </div>
      <div class="information-block">
        <span>DEPARTMENT / UNIT</span>
        <strong>${reportDept}</strong>
        <small>${reportUnit}</small>
      </div>
      <div class="information-block">
        <span>REPORT PERIOD</span>
        <strong>${report.period}</strong>
        <small>Billing Date: ${REPORT.billingDate}</small>
      </div>
      <div class="information-block status-block">
        <span>STATUS</span>
        <strong>${REPORT.status}</strong>
        <small>For verification and approval</small>
      </div>
    </div>

    <div class="salary-table-section">
      <div class="table-caption">
        <div><strong>Duty and Compensation Records</strong><span>Verified activities included in this monthly statement</span></div>
        <span>${rows.length} RECORDS</span>
      </div>
      <div class="salary-table-wrap">
        <table class="salary-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>AREA OF EXPOSURE</th>
              <th>TIME</th>
              <th class="center">HRS</th>
              <th>REMARKS</th>
              <th class="right">HR RATE</th>
              <th>SIGNATURE</th>
              <th>ATTESTATION</th>
            </tr>
          </thead>
          <tbody>${renderSalaryRows(rows)}</tbody>
        </table>
      </div>
    </div>

    <section class="salary-computation">
      ${renderSummary(rows)}
    </section>

    <footer class="salary-report-footer">
      <div class="prepared-note"><i class="fa-solid fa-circle-info"></i> This report is generated from recorded clinical and academic duty schedules in 1SCHED.</div>
      <div class="signature-grid">
        <div class="signature-box"><div class="signature-line"></div><strong>${reportName}</strong><span>Clinical Instructor</span></div>
        <div class="signature-box"><div class="signature-line"></div><strong>Department Chairperson</strong><span>College of Nursing & Midwifery</span></div>
        <div class="signature-box"><div class="signature-line"></div><strong>VP for Academic Affairs / Finance</strong><span>Human Resources & Payroll</span></div>
      </div>
    </footer>
  `;
}

function renderReportSheet(rows, reportUser) {
  const sheet = get('salaryReportSheet');
  if (!sheet) return;
  sheet.innerHTML = buildReportSheetMarkup(rows, reportUser);
}

function renderAllInstructorReports() {
  const sheet = get('salaryReportSheet');
  if (!sheet) return;

  const instructorUsers = state.users.filter(user => user.role === 'INSTRUCTOR');
  sheet.innerHTML = instructorUsers.map(user => {
    const rows = getUserRows(user);
    return `<div class="salary-report-stack-item">${buildReportSheetMarkup(rows, user)}</div>`;
  }).join('');
}

export function renderSalaryReport() {
  const currentQuery = (get('salarySearch')?.value || '').trim();
  const reportUser = getSelectedUser();
  const rows = selectedRows();
  const defaultStart = '2026-01-01';
  const defaultEnd = '2026-12-31';
  const matches = currentQuery ? getInstructorMatches(currentQuery) : [];

  get('content').innerHTML = `
    <div class="salary-module">
      <section class="salary-controls card">
        <div class="salary-controls-title">
          <div class="salary-section-icon"><i class="fa-solid fa-file-invoice-dollar"></i></div>
          <div>
            <span class="eyebrow">SALARY REPORT</span>
            <h3>Monthly Salary Statement</h3>
            <p>Review instructor duty records, compensation rates, and monthly salary due.</p>
          </div>
        </div>

        <div class="salary-filter-grid">
          <div class="salary-filter salary-search-filter">
            <label for="salarySearch">INSTRUCTOR NAME / EMPLOYEE ID</label>
            <div class="salary-search-with-list">
              <div class="salary-input-icon">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input id="salarySearch" value="${esc(currentQuery)}" placeholder="Search instructor or employee ID">
              </div>
              <div class="salary-search-results" ${currentQuery ? '' : 'style="display:none"'}>
                ${currentQuery ? (matches.length ? matches.map(user => `
                  <button type="button" class="salary-search-result" data-user-id="${user.id}">
                    <span>${esc(user.name)}</span>
                    <small>${esc(user.employeeId || 'Employee ID')}</small>
                  </button>
                `).join('') : '<div class="salary-search-empty">No instructor found</div>') : ''}
              </div>
            </div>
          </div>
          <div class="salary-filter">
            <label for="salaryStartDate">START DATE</label>
            <input id="salaryStartDate" type="date" value="${get('salaryStartDate')?.value || defaultStart}">
          </div>
          <div class="salary-filter">
            <label for="salaryEndDate">END DATE</label>
            <input id="salaryEndDate" type="date" value="${get('salaryEndDate')?.value || defaultEnd}">
          </div>
          <button class="btn primary salary-print-btn" onclick="printSalaryReport()">
            <i class="fa-solid fa-print"></i> Print Report
          </button>
        </div>
      </section>

      <section class="salary-report-sheet" id="salaryReportSheet"></section>
    </div>
  `;

  const searchInput = get('salarySearch');
  if (searchInput) {
    searchInput.oninput = () => {
      const query = (searchInput.value || '').trim();
      const list = document.querySelector('.salary-search-results');
      const matchedUsers = query ? getInstructorMatches(query) : [];

      if (list) {
        list.style.display = query ? 'flex' : 'none';
        list.innerHTML = query
          ? (matchedUsers.length
              ? matchedUsers.map(user => `
                  <button type="button" class="salary-search-result" data-user-id="${user.id}">
                    <span>${esc(user.name)}</span>
                    <small>${esc(user.employeeId || 'Employee ID')}</small>
                  </button>
                `).join('')
              : '<div class="salary-search-empty">No instructor found</div>')
          : '';
      }

      document.querySelectorAll('.salary-search-result').forEach(button => {
        button.addEventListener('click', () => {
          const selectedUser = state.users.find(user => String(user.id) === String(button.dataset.userId));
          if (!selectedUser) return;

          const input = get('salarySearch');
          if (input) input.value = selectedUser.name;
          if (list) list.style.display = 'none';
          renderReportSheet(getUserRows(selectedUser), selectedUser);
        });
      });
    };
  }

  document.querySelectorAll('.salary-search-result').forEach(button => {
    button.addEventListener('click', () => {
      const selectedUser = state.users.find(user => String(user.id) === String(button.dataset.userId));
      if (!selectedUser) return;

      const input = get('salarySearch');
      if (input) input.value = selectedUser.name;
      const list = document.querySelector('.salary-search-results');
      if (list) list.style.display = 'none';
      renderReportSheet(getUserRows(selectedUser), selectedUser);
    });
  });

  const startDateInput = get('salaryStartDate');
  const endDateInput = get('salaryEndDate');
  if (startDateInput) startDateInput.onchange = () => renderSalaryReport();
  if (endDateInput) endDateInput.onchange = () => renderSalaryReport();

  if (!currentQuery && !reportUser) {
    renderAllInstructorReports();
  } else {
    renderReportSheet(rows, reportUser);
  }
}

export function printSalaryReport() {
  const rows = selectedRows();
  const report = buildReportMarkup(rows);
  const selectedUser = getSelectedUser();
  const reportName = selectedUser?.name || 'All Instructors';
  const reportEmployeeId = selectedUser?.employeeId || 'ALL INSTRUCTORS';
  const reportDept = selectedUser?.dept || 'Multiple departments';
  const reportUnit = selectedUser?.unit || 'Combined salary report';
  const popup = window.open('', '_blank', 'width=1200,height=850');

  if (!popup) {
    alert('Please allow pop-ups to print the salary report.');
    return;
  }

  const table = rows.map(row => `
    <tr>
      <td>${formatLongDate(row.date)}</td>
      <td><strong>${esc(row.area)}</strong></td>
      <td>${esc(row.time)}</td>
      <td class="center">${row.hours}</td>
      <td>${esc(row.remarks)}</td>
      <td class="right">${moneyWhole(row.rate)}</td>
      <td></td>
      <td></td>
    </tr>
  `).join('');

  const breakdown = report.categories.map(item => `
    <div><span>${esc(item.type)}</span><b>${item.hrs} hrs × ${moneyWhole(item.rate)}</b><strong>${money(item.amount)}</strong></div>
  `).join('');

  popup.document.write(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Salary Report</title>
<style>
@page{size:A4 landscape;margin:8mm}
*{box-sizing:border-box}
body{margin:0;background:#eef1f5;color:#172033;font-family:Arial,Helvetica,sans-serif;font-size:8px}
.sheet{width:100%;background:#fff;border:1px solid #d5dbe3;padding:16px 18px}
.topline{height:4px;background:#173d62;margin:-16px -18px 14px}
.header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #dce2e8;padding-bottom:10px;margin-bottom:12px}
.brand{display:flex;gap:9px;align-items:center}.logo{width:30px;height:30px;border-radius:5px;background:#173d62;color:#fff;display:grid;place-items:center;font-weight:700;font-size:11px}.brand b{display:block;font-size:13px;color:#173d62}.brand small{display:block;color:#687587;font-size:6px;letter-spacing:.4px;margin-top:2px}.doc{text-align:right}.doc span{display:block;font-size:6px;color:#7b8797;font-weight:700;letter-spacing:.5px}.doc strong{display:block;font-size:11px;color:#172033;margin-top:2px}.doc small{font-size:7px;color:#536176}
.title{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}.title .eyebrow{font-size:6px;color:#637187;font-weight:700;letter-spacing:.7px}.title h1{font-size:15px;margin:3px 0;color:#172033}.title p{font-size:7px;margin:0;color:#667386}.status{display:flex;gap:6px;align-items:center;border:1px solid #b9e3c9;background:#f1fbf5;color:#187543;padding:7px 10px;border-radius:4px}.status b{font-size:7px;display:block}.status span{font-size:6px;display:block;color:#56816a;margin-top:2px}
.stats{display:grid;grid-template-columns:1fr 1fr 1.7fr 1.2fr;border:1px solid #dfe4ea;background:#f6f8fa;margin-bottom:10px}.stats>div{padding:7px 9px;border-right:1px solid #dfe4ea}.stats>div:last-child{border-right:0}.stats span{display:block;font-size:5.8px;color:#778397;font-weight:700;text-transform:uppercase}.stats strong{display:block;font-size:8px;margin-top:2px}
.meta{display:grid;grid-template-columns:1.2fr 1.4fr 1.5fr .7fr;gap:0;border:1px solid #d9dfe6;margin-bottom:10px}.meta div{padding:8px 9px;border-right:1px solid #d9dfe6}.meta div:last-child{border-right:0}.meta span{display:block;font-size:5.8px;color:#687589;font-weight:700;margin-bottom:3px}.meta strong{display:block;font-size:7.5px}.meta small{display:block;color:#7c8795;font-size:5.8px;margin-top:2px}.approved{color:#168048}
.table{width:100%;border-collapse:collapse;table-layout:fixed}.table th{background:#31465f;color:#fff;padding:6px 5px;font-size:5.8px;text-align:left}.table td{padding:5px;border-bottom:1px solid #e4e8ed;font-size:6.7px;vertical-align:middle}.table tr:nth-child(even) td{background:#f8fafc}.center{text-align:center}.right{text-align:right}.caption{font-size:7px;font-weight:700;color:#31445d;margin:0 0 5px}.caption span{font-weight:400;color:#7a8695;margin-left:5px}
.summary{border-top:1px solid #8793a3;margin-top:7px;padding-top:8px;display:grid;grid-template-columns:1.8fr .8fr;gap:15px}.summary h3{margin:0 0 5px;font-size:7px;color:#31445d}.line{display:grid;grid-template-columns:1fr 1fr auto;gap:8px;font-size:6px;line-height:1.6}.line b{font-weight:400;color:#657186}.total{border:1px solid #c8e7d2;background:#f2fbf5;padding:10px;text-align:right;align-self:start}.total span{display:block;font-size:6px;color:#4f6b59;font-weight:700}.total strong{display:block;font-size:18px;color:#178149;margin-top:2px}
.signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:45px;margin-top:28px}.sig{border-top:1px solid #8792a1;padding-top:5px}.sig strong{display:block;font-size:6.8px}.sig span{display:block;font-size:5.8px;color:#6c7787;margin-top:2px}.footer{text-align:center;margin-top:9px;padding-top:7px;border-top:1px solid #e1e5ea;color:#8993a1;font-size:5.5px}
</style>
</head>
<body>
<div class="sheet">
<div class="topline"></div>
<div class="header"><div class="brand"><div class="logo">1S</div><div><b>1SCHED</b><small>CLINICAL SCHEDULING & SALARY REPORT SYSTEM</small></div></div><div class="doc"><span>OFFICIAL DOCUMENT</span><strong>MONTHLY SALARY REPORT</strong><small>${report.period}</small></div></div>
<div class="title"><div><div class="eyebrow">ACADEMIC & CLINICAL OPERATIONS</div><h1>Salary Report</h1><p>Academic Year 2026–2027</p></div><div class="status"><b>●</b><div><b>APPROVED</b><span>Report Status</span></div></div></div>
<div class="stats"><div><span>Duty Records</span><strong>${rows.length}</strong></div><div><span>Total Duty Hours</span><strong>${rows.reduce((s,r)=>s+Number(r.hours||0),0)}</strong></div><div><span>Report Period</span><strong>${report.period}</strong></div><div><span>Billing Date</span><strong>${REPORT.billingDate}</strong></div></div>
<div class="meta"><div><span>INSTRUCTOR</span><strong>${reportName}</strong><small>Employee ID: ${reportEmployeeId}</small></div><div><span>DEPARTMENT / UNIT</span><strong>${reportDept}</strong><small>${reportUnit}</small></div><div><span>REPORT PERIOD</span><strong>${report.period}</strong><small>Billing Date: ${REPORT.billingDate}</small></div><div><span>STATUS</span><strong class="approved">${REPORT.status}</strong><small>For verification and approval</small></div></div>
<div class="caption">Duty and Compensation Records <span>Verified activities included in this monthly statement</span></div>
<table class="table"><thead><tr><th style="width:9%">DATE</th><th style="width:23%">AREA OF EXPOSURE</th><th style="width:14%">TIME</th><th style="width:5%">HRS</th><th style="width:14%">REMARKS</th><th style="width:8%">HR RATE</th><th style="width:12%">SIGNATURE</th><th style="width:15%">ATTESTATION</th></tr></thead><tbody>${table}</tbody></table>
<div class="summary"><div><h3>MONTHLY COMPUTATION SUMMARY</h3>${breakdown}</div><div class="total"><span>TOTAL SALARY DUE</span><strong>${moneyWhole(total)}</strong></div></div>
<div class="signatures"><div class="sig"><strong>${reportName}</strong><span>Clinical Instructor</span></div><div class="sig"><strong>Department Chairperson</strong><span>College of Nursing & Midwifery</span></div><div class="sig"><strong>VP for Academic Affairs / Finance</strong><span>Human Resources & Payroll</span></div></div>
<div class="footer">Generated by 1SCHED — Clinical Scheduling and Salary Report System</div>
</div>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();};<\/script>
</body></html>`);
  popup.document.close();
}

window.printSalaryReport = printSalaryReport;
