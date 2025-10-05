// auth.js
import { supabase } from './supabase.js';

// Elementy UI
const avatarBtn      = document.getElementById('avatarBtn');
const accountMenu    = document.getElementById('accountMenu');
const avatarInitials = document.getElementById('avatarInitials');
const menuInitials   = document.getElementById('menuInitials');
const menuEmail      = document.getElementById('menuEmail');
const menuStatus     = document.getElementById('menuStatus');

const loginBtn  = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Modal logowania/rejestracji
const loginModal     = document.getElementById('loginModal');
const loginEmail     = document.getElementById('loginEmail');
const loginPassword  = document.getElementById('loginPassword');
const signupEmail    = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');

// Przełączniki widoków w modalu
const viewLoginBtn   = document.getElementById('viewLoginBtn');
const viewSignupBtn  = document.getElementById('viewSignupBtn');
const loginView      = document.getElementById('loginView');
const signupView     = document.getElementById('signupView');
const forgotLink     = document.getElementById('forgotLink');
const resetEmail     = document.getElementById('resetEmail');
const resetSend      = document.getElementById('resetSend');

// Przyciski akcji
const loginSend  = document.getElementById('loginSend');
const signupSend = document.getElementById('signupSend');
const loginCancel     = document.getElementById('loginCancel');
const loginCancelTop  = document.getElementById('loginCancelTop');

// Helpers modala
function openLogin() {
  if (!loginModal) return;
  showLoginView();                    // domyślnie login
  loginModal.classList.add('open');
  loginModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => loginEmail?.focus(), 0);
}
function closeLogin() {
  if (!loginModal) return;
  loginModal.classList.remove('open');
  loginModal.setAttribute('aria-hidden', 'true');
}
function openMenu(){ accountMenu.hidden = false; }
function closeMenu(){ accountMenu.hidden = true; }

// Widoki w modalu
function showLoginView(){
  loginView?.classList.remove('hidden');
  signupView?.classList.add('hidden');
}
function showSignupView(){
  signupView?.classList.remove('hidden');
  loginView?.classList.add('hidden');
}

// Inicjały z maila
function initialsFromEmail(email){
  if (!email) return '?';
  const name = email.split('@')[0] || '';
  const parts = name.replace(/[^\p{L}\p{N}_-]+/gu, ' ')
                    .trim().split(/[\.\_\- ]+/);
  const a = (parts[0]?.[0] || '').toUpperCase();
  const b = (parts[1]?.[0] || '').toUpperCase();
  return (a + (b || '')).slice(0,2) || '?';
}

// Render stanu użytkownika
function renderUser(user){
  if (user){
    avatarBtn?.classList.remove('guest');
    const email = user.email || '(brak email)';
    const ini = initialsFromEmail(email);
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

// Klik na avatarze
avatarBtn?.addEventListener('click', (e) => {
  e.stopPropagation();
  // Gość? Otwórz od razu modal logowania
  if (avatarBtn.classList.contains('guest')) {
    openLogin();
    return;
  }
  // Zalogowany: pokaż/ukryj menu konta
  accountMenu.hidden ? openMenu() : closeMenu();
});

// Zamknięcie menu po kliknięciu poza
document.addEventListener('click', (e) => {
  if (accountMenu.hidden) return;
  const inside = accountMenu.contains(e.target) || avatarBtn.contains(e.target);
  if (!inside) closeMenu();
});

// Przełączniki widoków
viewLoginBtn?.addEventListener('click', showLoginView);
viewSignupBtn?.addEventListener('click', showSignupView);

// Zamknięcia modala
loginCancel?.addEventListener('click', closeLogin);
loginCancelTop?.addEventListener('click', closeLogin);
loginModal?.addEventListener('click', (e) => {
  if (e.target.classList?.contains('modal-backdrop')) closeLogin();
});

// Logowanie (email+hasło)
loginSend?.addEventListener('click', async () => {
  const email = (loginEmail?.value || '').trim();
  const pass  = (loginPassword?.value || '').trim();
  if (!email || !pass){ alert('Podaj e-mail i hasło.'); return; }

  const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error){ alert('Błąd logowania: ' + error.message); return; }
  closeLogin(); closeMenu();
});

// Rejestracja (email+hasło)
signupSend?.addEventListener('click', async () => {
  const email = (signupEmail?.value || '').trim();
  const pass  = (signupPassword?.value || '').trim();
  if (!email || !pass){ alert('Podaj e-mail i hasło.'); return; }

  const { error } = await supabase.auth.signUp({ email, password: pass });
  if (error){ alert('Błąd rejestracji: ' + error.message); return; }
  alert('Konto utworzone. Sprawdź e-mail (potwierdzenie) i zaloguj się.');
  showLoginView();
});

// Reset hasła (tylko na widoku logowania)
forgotLink?.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = (resetEmail?.value || loginEmail?.value || '').trim();
  if (!email){ alert('Podaj adres e-mail do resetu.'); return; }
  const redirectTo = location.origin + location.pathname; // wraca na tę stronę
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error){ alert('Błąd resetu: ' + error.message); return; }
  alert('Wysłaliśmy link do resetu hasła. Sprawdź skrzynkę.');
});

// Główne przyciski menu
loginBtn?.addEventListener('click', () => { closeMenu(); openLogin(); });
logoutBtn?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  renderUser(null);
  closeMenu();
});

// Inicjalizacja: wykryj sesję i reaguj na zmiany
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  renderUser(session?.user || null);

  supabase.auth.onAuthStateChange((_event, session) => {
    renderUser(session?.user || null);
  });
})();
