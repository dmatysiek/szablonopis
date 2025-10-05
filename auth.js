// auth.js
import { supabase } from './supabase.js';

// ============ UI ============

const avatarBtn      = document.getElementById('avatarBtn');
const accountMenu    = document.getElementById('accountMenu');
const avatarInitials = document.getElementById('avatarInitials');
const menuInitials   = document.getElementById('menuInitials');
const menuEmail      = document.getElementById('menuEmail');
const menuStatus     = document.getElementById('menuStatus');

const loginBtn  = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Modal
const loginModal     = document.getElementById('loginModal');
const loginCancel    = document.getElementById('loginCancel');
const loginCancelTop = document.getElementById('loginCancelTop');

const modeLoginBtn  = document.getElementById('modeLogin');
const modeSignupBtn = document.getElementById('modeSignup');
const formLogin     = document.getElementById('formLogin');
const formSignup    = document.getElementById('formSignup');

// login fields
const lEmail = document.getElementById('lEmail');
const lPass  = document.getElementById('lPass');
const loginDo = document.getElementById('loginDo');
const resetLink = document.getElementById('resetLink');

// signup fields
const sEmail  = document.getElementById('sEmail');
const sPass   = document.getElementById('sPass');
const sPass2  = document.getElementById('sPass2');
const signupDo = document.getElementById('signupDo');

// ============ helpers ============

function openMenu(){ accountMenu.hidden = false; }
function closeMenu(){ accountMenu.hidden = true; }

function openLogin(mode = 'login'){
  setMode(mode);
  loginModal.classList.add('open');
  loginModal.setAttribute('aria-hidden','false');
  setTimeout(() => (mode === 'login' ? lEmail?.focus() : sEmail?.focus()), 0);
}
function closeLogin(){
  loginModal.classList.remove('open');
  loginModal.setAttribute('aria-hidden','true');
}

function setMode(mode){
  if (mode === 'login'){
    formLogin.style.display  = '';
    formSignup.style.display = 'none';
    modeLoginBtn.classList.remove('secondary');
    modeSignupBtn.classList.add('secondary');
  } else {
    formLogin.style.display  = 'none';
    formSignup.style.display = '';
    modeSignupBtn.classList.remove('secondary');
    modeLoginBtn.classList.add('secondary');
  }
}

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
    const email = user.email || '(brak email)';
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

// ============ menu/ikonka ============

avatarBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  accountMenu.hidden ? openMenu() : closeMenu();
});
document.addEventListener('click', (e) => {
  if (accountMenu.hidden) return;
  const inside = accountMenu.contains(e.target) || avatarBtn.contains(e.target);
  if (!inside) closeMenu();
});

loginBtn?.addEventListener('click', () => { closeMenu(); openLogin('login'); });
logoutBtn?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  renderUser(null);
  closeMenu();
});

// ============ modal obsługa ============

loginCancel?.addEventListener('click', closeLogin);
loginCancelTop?.addEventListener('click', closeLogin);
loginModal?.addEventListener('click', (e) => {
  if (e.target.classList?.contains('modal-backdrop')) closeLogin();
});

modeLoginBtn?.addEventListener('click', () => setMode('login'));
modeSignupBtn?.addEventListener('click', () => setMode('signup'));

// ============ logowanie hasłem ============

loginDo?.addEventListener('click', async () => {
  const email = (lEmail.value || '').trim();
  const pass  = lPass.value || '';
  if (!email || !pass){ alert('Podaj e-mail i hasło.'); return; }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error){
    alert('Logowanie nieudane: ' + error.message);
    return;
  }
  renderUser(data.user);
  closeLogin();
});

// ============ reset hasła (link e-mail) ============

resetLink?.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = (lEmail.value || '').trim();
  if (!email){ alert('Podaj e-mail, na który wyślemy link resetu.'); return; }

  const redirectTo = location.origin + location.pathname; // np. /sales.html
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error){ alert('Błąd wysyłki linku: ' + error.message); return; }
  alert('Wysłaliśmy mail z linkiem do zmiany hasła.');
});

// Po kliknięciu linku resetu Supabase ustawi event PASSWORD_RECOVERY.
// Zapytamy użytkownika o nowe hasło i zaktualizujemy je.
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'PASSWORD_RECOVERY'){
    const newPass = prompt('Wpisz nowe hasło (min. 6 znaków):');
    if (newPass && newPass.length >= 6){
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) alert('Nie udało się ustawić nowego hasła: ' + error.message);
      else alert('Hasło zmienione. Zalogowano.');
    } else {
      alert('Hasło nie zostało zmienione.');
    }
  }
});

// ============ rejestracja ============

signupDo?.addEventListener('click', async () => {
  const email = (sEmail.value || '').trim();
  const pass  = sPass.value || '';
  const pass2 = sPass2.value || '';
  if (!email || !pass){ alert('Podaj e-mail i hasło.'); return; }
  if (pass.length < 6){ alert('Hasło musi mieć min. 6 znaków.'); return; }
  if (pass !== pass2){ alert('Hasła się nie zgadzają.'); return; }

  const redirectTo = location.origin + location.pathname; // gdzie trafi link potwierdzający, jeśli włączony
  const { data, error } = await supabase.auth.signUp({
    email,
    password: pass,
    options: { emailRedirectTo: redirectTo }
  });

  if (error){
    alert('Rejestracja nieudana: ' + error.message);
    return;
  }

  // Jeśli wymagasz potwierdzenia e-mail – użytkownik dostanie mail z linkiem.
  // Jeśli nie – będzie od razu zalogowany.
  renderUser(data.user || null);
  alert('Konto utworzone. Sprawdź skrzynkę, jeśli wymagane jest potwierdzenie e-mail.');
  closeLogin();
});

// ============ start: odtwórz sesję ============

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  renderUser(session?.user || null);
})();
