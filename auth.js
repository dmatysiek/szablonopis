// auth.js
import { supabase } from './supabase.js';

// --- Elementy UI (sales.html ma te ID) ---
const avatarBtn      = document.getElementById('avatarBtn');
const accountMenu    = document.getElementById('accountMenu');
const avatarInitials = document.getElementById('avatarInitials');
const menuInitials   = document.getElementById('menuInitials');
const menuEmail      = document.getElementById('menuEmail');
const menuStatus     = document.getElementById('menuStatus');

const loginBtn  = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Modal i pola
const loginModal     = document.getElementById('loginModal');
const loginEmail     = document.getElementById('loginEmail');
const loginPassword  = document.getElementById('loginPassword');

const switchToLogin  = document.getElementById('switchToLogin');
const switchToSignup = document.getElementById('switchToSignup');
const loginSend      = document.getElementById('loginSend');
const loginCancel    = document.getElementById('loginCancel');
const loginCancelTop = document.getElementById('loginCancelTop');
const resetLink      = document.getElementById('resetLink');

// --- Stan trybu modala: "login" | "signup" ---
let authMode = 'login';

function initialsFromEmail(email){
  if (!email) return '?';
  const name = (email.split('@')[0] || '').trim();
  const parts = name.replace(/[^\p{L}\p{N}_-]+/gu, ' ')
                    .split(/[\.\_\- ]+/).filter(Boolean);
  const a = (parts[0]?.[0] || '').toUpperCase();
  const b = (parts[1]?.[0] || '').toUpperCase();
  return (a + (b || '')).slice(0,2) || '?';
}

function renderUser(user){
  if (user){
    avatarBtn?.classList.remove('guest');
    const email = user.email || '(brak email)';
    const ini   = initialsFromEmail(email);
    if (avatarInitials) avatarInitials.textContent = ini;
    if (menuInitials)   menuInitials.textContent   = ini;
    if (menuEmail)      menuEmail.textContent      = email;
    if (menuStatus)     menuStatus.textContent     = 'Zalogowany';
    if (loginBtn)  loginBtn.style.display  = 'none';
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
  } else {
    avatarBtn?.classList.add('guest');
    if (avatarInitials) avatarInitials.textContent = '?';
    if (menuInitials)   menuInitials.textContent   = '?';
    if (menuEmail)      menuEmail.textContent      = 'Niezalogowany';
    if (menuStatus)     menuStatus.textContent     = '—';
    if (loginBtn)  loginBtn.style.display  = 'inline-block';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
}

// --- Modal helpers ---
function openLogin(){
  if (!loginModal) return;
  setMode('login');
  loginModal.classList.add('open');
  loginModal.setAttribute('aria-hidden','false');
  setTimeout(()=> loginEmail?.focus(), 0);
}
function openSignup(){
  if (!loginModal) return;
  setMode('signup');
  loginModal.classList.add('open');
  loginModal.setAttribute('aria-hidden','false');
  setTimeout(()=> loginEmail?.focus(), 0);
}
function closeLogin(){
  if (!loginModal) return;
  loginModal.classList.remove('open');
  loginModal.setAttribute('aria-hidden','true');
}
function openMenu(){ accountMenu.hidden = false; }
function closeMenu(){ accountMenu.hidden = true; }

function setMode(m){
  authMode = m; // 'login' | 'signup'
  if (m === 'login'){
    switchToLogin?.classList.remove('secondary');
    switchToSignup?.classList.add('secondary');
    if (loginSend) loginSend.textContent = 'Zaloguj';
  } else {
    switchToSignup?.classList.remove('secondary');
    switchToLogin?.classList.add('secondary');
    if (loginSend) loginSend.textContent = 'Zarejestruj';
  }
}

// --- Zdarzenia UI ---
avatarBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (avatarBtn.classList.contains('guest')) { openLogin(); return; }
  accountMenu.hidden ? openMenu() : closeMenu();
});
document.addEventListener('click', (e) => {
  if (accountMenu.hidden) return;
  const inside = accountMenu.contains(e.target) || avatarBtn.contains(e.target);
  if (!inside) closeMenu();
});

switchToLogin?.addEventListener('click', () => setMode('login'));
switchToSignup?.addEventListener('click', () => setMode('signup'));

loginCancel?.addEventListener('click', closeLogin);
loginCancelTop?.addEventListener('click', closeLogin);
loginModal?.addEventListener('click', (e) => {
  if (e.target.classList?.contains('modal-backdrop')) closeLogin();
});

loginBtn?.addEventListener('click', () => { closeMenu(); openLogin(); });
logoutBtn?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  renderUser(null);
  closeMenu();
});

// --- Akcje auth ---
loginSend?.addEventListener('click', async () => {
  const email = (loginEmail?.value || '').trim();
  const pass  = (loginPassword?.value || '').trim();
  if (!email || !pass){ alert('Podaj e-mail i hasło.'); return; }

  if (authMode === 'login'){
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error){ alert('Błąd logowania: ' + error.message); return; }
    closeLogin(); closeMenu();
  } else {
    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error){ alert('Błąd rejestracji: ' + error.message); return; }
    // Jeśli w projekcie aktywne jest potwierdzanie maila,
    // użytkownik musi kliknąć link w e-mailu.
    alert('Konto utworzone. Sprawdź e-mail (potwierdzenie), a potem zaloguj się.');
    setMode('login');
  }
});

// Reset hasła (wyśle link na e-mail)
resetLink?.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = (loginEmail?.value || '').trim();
  if (!email){ alert('Podaj adres e-mail do resetu.'); return; }
  const redirectTo = location.origin + location.pathname; // powrót na tę stronę
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error){ alert('Błąd resetu: ' + error.message); return; }
  alert('Wysłaliśmy link do resetu hasła. Sprawdź skrzynkę.');
});

// --- Inicjalizacja i nasłuch stanu sesji ---
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  renderUser(session?.user || null);
  supabase.auth.onAuthStateChange((_event, session) => {
    renderUser(session?.user || null);
  });
})();
