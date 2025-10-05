// auth.js
import { supabase } from './supabase.js';

// ---------- Uchwyty UI (topbar) ----------
const avatarBtn      = document.getElementById('avatarBtn');
const accountMenu    = document.getElementById('accountMenu');
const avatarInitials = document.getElementById('avatarInitials');
const menuInitials   = document.getElementById('menuInitials');
const menuEmail      = document.getElementById('menuEmail');
const menuStatus     = document.getElementById('menuStatus');
const loginBtn       = document.getElementById('loginBtn');
const logoutBtn      = document.getElementById('logoutBtn');

// ---------- Modal ----------
const loginModal     = document.getElementById('loginModal');
const loginCancel    = document.getElementById('loginCancel');
const loginCancelTop = document.getElementById('loginCancelTop');

const loginEmail   = document.getElementById('loginEmail');
const loginPass    = document.getElementById('loginPass');
const loginPass2   = document.getElementById('loginPass2');
const confirmRow   = document.getElementById('confirmRow');

const loginSubmit  = document.getElementById('loginSubmit');
const resetRow     = document.getElementById('resetRow');
const resetLink    = document.getElementById('resetLink');
const switchRow    = document.getElementById('switchRow');
const switchLink   = document.getElementById('switchLink');

// ---------- Pomocnicze ----------
function initialsFromEmail(email){
  if (!email) return '?';
  const name = email.split('@')[0] || '';
  const parts = name.replace(/[^\p{L}\p{N}_-]+/gu, ' ').trim().split(/[\.\_\- ]+/);
  const a = (parts[0]?.[0] || '').toUpperCase();
  const b = (parts[1]?.[0] || '').toUpperCase();
  return (a + (b || '')).slice(0,2) || '?';
}

function renderUser(user){
  if (user){
    const email = user.email || '(brak e-mail)';
    const ini = initialsFromEmail(email);
    avatarInitials.textContent = ini;
    menuInitials.textContent   = ini;
    menuEmail.textContent      = email;
    menuStatus.textContent     = 'Zalogowany';
    loginBtn.style.display  = 'none';
    logoutBtn.style.display = 'inline-block';
  } else {
    avatarInitials.textContent = '?';
    menuInitials.textContent   = '?';
    menuEmail.textContent      = 'Niezalogowany';
    menuStatus.textContent     = '—';
    loginBtn.style.display  = 'inline-block';
    logoutBtn.style.display = 'none';
  }
}

// ---------- Menu konta ----------
function openMenu(){ accountMenu.hidden = false; }
function closeMenu(){ accountMenu.hidden = true; }
avatarBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  accountMenu.hidden ? openMenu() : closeMenu();
});
document.addEventListener('click', (e) => {
  if (accountMenu.hidden) return;
  const inside = accountMenu.contains(e.target) || avatarBtn.contains(e.target);
  if (!inside) closeMenu();
});

// ---------- Modal ----------
function openLoginModal(defaultMode='login'){
  setMode(defaultMode);
  loginModal.classList.add('open');
  loginModal.setAttribute('aria-hidden','false');
  setTimeout(()=> loginEmail?.focus(), 0);
}
function closeLoginModal(){
  loginModal.classList.remove('open');
  loginModal.setAttribute('aria-hidden','true');
}
loginBtn.addEventListener('click', () => { closeMenu(); openLoginModal('login'); });
loginCancel.addEventListener('click', closeLoginModal);
loginCancelTop.addEventListener('click', closeLoginModal);
loginModal.addEventListener('click', (e) => {
  if (e.target.classList?.contains('modal-backdrop')) closeLoginModal();
});

// ---------- Tryby: login / register ----------
let mode = 'login';
function setMode(m){
  mode = m;
  const isReg = (mode === 'register');
  confirmRow.style.display = isReg ? 'block' : 'none';
  loginSubmit.textContent  = isReg ? 'Zarejestruj' : 'Zaloguj';

  // Pokaż reset tylko w logowaniu
  if (resetRow) resetRow.style.display = isReg ? 'none' : 'block';
  
  // zdanie pod formularzem
  if (isReg){
    switchRow.firstChild.textContent = 'Masz już konto? ';
    switchLink.textContent = 'Zaloguj się';
  } else {
    switchRow.firstChild.textContent = 'Nie masz jeszcze konta? ';
    switchLink.textContent = 'Zarejestruj się tutaj';
  }
}
switchLink.addEventListener('click', (e) => {
  e.preventDefault();
  setMode(mode === 'login' ? 'register' : 'login');
});

// ---------- Akcje: logowanie / rejestracja / reset ----------
loginSubmit.addEventListener('click', async () => {
  const email = (loginEmail.value || '').trim();
  const pass  = (loginPass.value || '').trim();
  if (!email || !pass){ alert('Podaj e-mail i hasło.'); return; }

  try{
    if (mode === 'login'){
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      closeLoginModal();
    } else {
      const pass2 = (loginPass2.value || '').trim();
      if (pass !== pass2){ alert('Hasła nie są takie same.'); return; }
      const { error } = await supabase.auth.signUp({
        email, password: pass,
        options: { emailRedirectTo: location.origin + location.pathname }
      });
      if (error) throw error;
      alert('Sprawdź e-mail i potwierdź rejestrację.');
      setMode('login');
    }
  } catch(err){
    alert('Błąd: ' + err.message);
  }
});

resetLink.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = (loginEmail.value || '').trim();
  if (!email){ alert('Podaj e-mail, żeby wysłać link resetu.'); return; }
  try{
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: location.origin + location.pathname
    });
    if (error) throw error;
    alert('Wysłaliśmy link resetu. Sprawdź skrzynkę.');
  } catch(err){
    alert('Błąd: ' + err.message);
  }
});

// ---------- Wylogowanie ----------
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  renderUser(null);
  closeMenu();
});

// ---------- Inicjalizacja ----------
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  renderUser(session?.user || null);
  supabase.auth.onAuthStateChange((_event, session) => {
    renderUser(session?.user || null);
  });
})();
