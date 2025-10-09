// auth.js
import { supabase } from './supabase.js';

// --- Elementy topbar / konto ---
const avatarBtn      = document.getElementById('avatarBtn');
const accountMenu    = document.getElementById('accountMenu');
const avatarInitials = document.getElementById('avatarInitials');
const menuInitials   = document.getElementById('menuInitials');
const menuEmail      = document.getElementById('menuEmail');
const menuStatus     = document.getElementById('menuStatus');
const loginBtn       = document.getElementById('loginBtn');
const logoutBtn      = document.getElementById('logoutBtn');

// --- Modal + widoki ---
const loginModal   = document.getElementById('loginModal');
const loginView    = document.getElementById('loginView');
const signupView   = document.getElementById('signupView');
const loginTitle   = document.getElementById('loginTitle');

// Pola logowania
const loginEmail    = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const doLoginBtn    = document.getElementById('doLogin');
const resetLink     = document.getElementById('resetLink');

// Pola rejestracji
const suEmail     = document.getElementById('suEmail');
const suPass      = document.getElementById('suPass');
const suPass2     = document.getElementById('suPass2');
const doSignupBtn = document.getElementById('doSignup');

// Linki / przełączniki / zamknięcia
const gotoSignup     = document.getElementById('gotoSignup');
const gotoLogin      = document.getElementById('gotoLogin');
const loginCancel    = document.getElementById('loginCancel');   // może nie istnieć
const signupCancel   = document.getElementById('signupCancel');  // jw.
const loginCancelTop = document.getElementById('loginCancelTop');

// --- UI helpers ---
function openModal(){
  loginModal?.classList.add('open');
  loginModal?.setAttribute('aria-hidden','false');
}
function closeModal(){
  loginModal?.classList.remove('open');
  loginModal?.setAttribute('aria-hidden','true');
}
function showLoginView(){
  if (!loginView || !signupView) return;
  loginView.hidden  = false;
  signupView.hidden = true;
  if (loginTitle) loginTitle.textContent = 'Logowanie';
  setTimeout(()=> loginEmail?.focus(), 0);
}
function showSignupView(){
  if (!loginView || !signupView) return;
  loginView.hidden  = true;
  signupView.hidden = false;
  if (loginTitle) loginTitle.textContent = 'Rejestracja';
  setTimeout(()=> suEmail?.focus(), 0);
}
export function openLogin(){ showLoginView(); openModal(); } // wywoływane np. z sales.js
function openMenu(){ accountMenu.hidden = false; }
function closeMenu(){ accountMenu.hidden = true; }

// Jeśli gość zamknie modal → wracamy do Opis
async function goHomeIfGuest(){
  const { data:{ session } } = await supabase.auth.getSession();
  if (!session?.user){
    window.location.href = './index.html';
  }
}

// --- Avatar / inicjały ---
function initialsFromEmail(email){
  if (!email) return '?';
  const base  = (email.split('@')[0] || '').trim();
  const parts = base.replace(/[^\p{L}\p{N}_-]+/gu, ' ').split(/[\.\_\- ]+/).filter(Boolean);
  const a = (parts[0]?.[0] || '').toUpperCase();
  const b = (parts[1]?.[0] || '').toUpperCase();
  return (a + (b || '')).slice(0,2) || '?';
}

// Render stanu użytkownika (avatar/menu)
function renderUser(user){
  if (user){
    const email = user.email || '(brak email)';
    const ini   = initialsFromEmail(email);
    avatarBtn?.classList.remove('guest');
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

// --- Zdarzenia topbar/menu ---
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
loginBtn?.addEventListener('click', () => { closeMenu(); openLogin(); });
logoutBtn?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  renderUser(null);
  closeMenu();
});

// --- Zdarzenia modala (zamykanie + backdrop → powrót do Opisu dla gościa) ---
loginCancel?.addEventListener('click', async () => { closeModal(); await goHomeIfGuest(); });
signupCancel?.addEventListener('click', async () => { closeModal(); await goHomeIfGuest(); });
loginCancelTop?.addEventListener('click', async () => { closeModal(); await goHomeIfGuest(); });
loginModal?.addEventListener('click', async (e) => {
  if (e.target.classList?.contains('modal-backdrop')) { closeModal(); await goHomeIfGuest(); }
});

// Przełączanie widoków (linki)
gotoSignup?.addEventListener('click', (e) => { e.preventDefault(); showSignupView(); });
gotoLogin?.addEventListener('click',  (e) => { e.preventDefault(); showLoginView(); });

// --- Logowanie ---
doLoginBtn?.addEventListener('click', async () => {
  const email = (loginEmail?.value || '').trim();
  const pass  = (loginPassword?.value || '').trim();
  if (!email || !pass){ alert('Podaj e-mail i hasło.'); return; }
  const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error){ alert('Błąd logowania: ' + error.message); return; }
  closeModal(); closeMenu();
});

// --- Rejestracja ---
doSignupBtn?.addEventListener('click', async () => {
  const email = (suEmail?.value || '').trim();
  const p1    = (suPass?.value  || '').trim();
  const p2    = (suPass2?.value || '').trim();
  if (!email || !p1 || !p2){ alert('Uzupełnij pola.'); return; }
  if (p1 !== p2){ alert('Hasła nie są takie same.'); return; }
  const { error } = await supabase.auth.signUp({ email, password: p1 });
  if (error){ alert('Błąd rejestracji: ' + error.message); return; }
  alert('Konto utworzone. Sprawdź e-mail (potwierdzenie), a potem zaloguj się.');
  showLoginView();
});

// --- Reset hasła ---
resetLink?.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = (loginEmail?.value || suEmail?.value || '').trim();
  if (!email){ alert('Podaj adres e-mail.'); return; }
  const redirectTo = location.origin + location.pathname; // powrót na tę stronę
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error){ alert('Błąd resetu: ' + error.message); return; }
  alert('Wysłaliśmy link do resetu hasła. Sprawdź skrzynkę.');
});

// --- Inicjalizacja / nasłuch sesji ---
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  renderUser(session?.user || null);
  supabase.auth.onAuthStateChange((_event, session) => {
    renderUser(session?.user || null);
  });
})();

accountMenu?.addEventListener('click', (e) => {
  e.stopPropagation();
});
