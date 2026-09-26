import {get} from './utils.js';
export function login(){
  get('login').classList.add('hidden');
  get('app').classList.remove('hidden');
  window.showPage('dashboard');
}
export function logout(){
  get('app').classList.add('hidden');
  get('login').classList.remove('hidden');
}
window.login=login;
window.logout=logout;
