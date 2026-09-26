export const state = {
  users: [
    {id:1,name:'Maria Santos',employeeId:'CI-2026-001',role:'INSTRUCTOR',dept:'BS NURSING',unit:'Clinical Instruction & Community Health',rate:450,status:'Active'},
    {id:2,name:'John Dela Cruz',employeeId:'CI-2026-002',role:'INSTRUCTOR',dept:'BS MIDWIFERY',unit:'Clinical Instruction & Community Health',rate:400,status:'Active'},
    {id:3,name:'Admin User',employeeId:'ADM-2026-001',role:'ADMIN',dept:'ADMINISTRATION',unit:'Administration',rate:500,status:'Active'},
    {id:4,name:'Angela Reyes',employeeId:'CI-2026-003',role:'INSTRUCTOR',dept:'BS NURSING',unit:'Clinical Instruction & Community Health',rate:450,status:'Active'}
  ],
  schedules: [
    {id:1,date:'2026-09-21',area:'D.O. Plaza Memorial Hospital',program:'BS NURSING',year:'4',section:'Sec A',group:'Group 1',students:10,instructor:'Maria Santos',start:'06:00',end:'14:00',room:'Ward A',type:'Clinical Duty'},
    {id:2,date:'2026-09-22',area:'Rural Health Unit',program:'BS MIDWIFERY',year:'3',section:'Sec B',group:'Group 2',students:8,instructor:'John Dela Cruz',start:'08:00',end:'16:00',room:'RHU',type:'Community Duty'},
    {id:3,date:'2026-09-23',area:'D.O. Plaza Memorial Hospital',program:'BS NURSING',year:'4',section:'Sec A',group:'Group 2',students:10,instructor:'Unassigned',start:'06:00',end:'14:00',room:'Ward A',type:'Clinical Duty'},
    {id:4,date:'2026-09-21',area:'Rural Health Unit',program:'BS NURSING',year:'3',section:'Sec C',group:'Group 3',students:12,instructor:'Maria Santos',start:'08:00',end:'12:00',room:'ICU',type:'Clinical Duty'}
  ],
  salaryRecords: [
    ['03','Skills Laboratory (Capping)','8:00 AM - 5:00 PM',8,'Regular Shift',150],
    ['04','Skills Laboratory (Capping)','8:00 AM - 5:00 PM',8,'Regular Shift',150],
    ['05','Skills Laboratory (Capping)','8:00 AM - 5:00 PM',8,'Regular Shift',150],
    ['06','Skills Laboratory (Capping)','8:00 AM - 5:00 PM',8,'Regular Shift',150],
    ['07','Skills Laboratory (Capping)','8:00 AM - 5:00 PM',1,'Overtime',230],
    ['08','Capping and Candle Lighting Ceremony','8:00 AM - 5:00 PM',8,'Special Duty',200],
    ['10','Skills Laboratory','8:00 AM - 5:00 PM',8,'Regular Shift',150],
    ['12','Skills Laboratory','8:00 AM - 5:00 PM',8,'Regular Shift',150],
    ['13','Skills Laboratory','8:00 AM - 5:00 PM',8,'Regular Shift',150],
    ['14','Skills Laboratory','8:00 AM - 5:00 PM',8,'Regular Shift',150],
    ['15','Skills Laboratory','8:00 AM - 5:00 PM',8,'Regular Shift',150],
    ['17','CHN Exposure','8:00 AM - 5:00 PM',8,'Field Duty',180],
    ['18','CHN Exposure','8:00 AM - 5:00 PM',8,'Field Duty',180],
    ['19','CHN Exposure','8:00 AM - 5:00 PM',8,'Field Duty',180],
    ['20','Case Presentation','8:00 AM - 5:00 PM',8,'Academic Duty',150],
    ['21','Skills Laboratory','8:00 AM - 5:00 PM',8,'Regular Shift',150],
    ['22','Skills Laboratory','8:00 AM - 5:00 PM',8,'Regular Shift',150],
    ['24','CHN Exposure','8:00 AM - 5:00 PM',8,'Field Duty',180],
    ['25','CHN Exposure','8:00 AM - 5:00 PM',8,'Field Duty',180],
    ['25','CHN Exposure','5:00 PM - 6:00 PM',1,'Overtime',230]
  ].map((r,i)=>({id:i+1,date:`2026-08-${r[0]}`,area:r[1],time:r[2],hours:r[3],remarks:r[4],rate:r[5],signature:'',attestation:''})),
  conflicts: [],
  resolvedConflictIds: []
};
