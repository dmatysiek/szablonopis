import { supabase } from './supabase.js';

// Elementy UI
const avatarBtn   = document.getElementById('avatarBtn');
const accountMenu = document.getElementById('accountMenu');
const avatarInitials = document.getElementById('avatarInitials');
const menuInitials   = document.getElementById('menuInitials');
const menuEmail      = document.getElementById('menuEmail');
const menuStatus     = document.getElementById('menuStatus');

const loginBtn   = document.getElementById('loginBtn');
const logoutBtn  = document.getElementById('logoutBtn');

// Modal logowania
const loginModal      = document.getElementById('loginModal');
const loginEmailInput = document.getElementById('loginEmail');
const loginSend       = document.getElementById('loginSend');
const loginCancel     = document.getElementById('loginCancel');
const loginCancelTop  = document.getElementById('loginCancelTop');

function openMenu(){ accountMenu.hidden = false; }
function closeMenu(){ accountMenu.hidden = true; }

function openLogin(){ 
  loginModal.classList.add('open'); 
  loginModal.setAttribute('aria-hidden','false'); 
  setTimeout(()=> loginEmailInput?.focus(), 0);
}
function closeLogin(){ 
  loginModal.classList.remove('open'); 
  loginModal.setAttribute('aria-hidden','true'); 
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

avatarBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  accountMenu.hidden ? openMenu() : closeMenu();
});

// Klik poza menu zamyka
document.addEventListener('click', (e) => {
  if (accountMenu.hidden) return;
  const inside = accountMenu.contains(e.target) || avatarBtn.contains(e.target);
  if (!inside) closeMenu();
});

// Modal login
loginBtn.addEventListener('click', () => { closeMenu(); openLogin(); });
loginCancel.addEventListener('click', closeLogin);
loginCancelTop.addEventListener('click', closeLogin);
loginModal.addEventListener('click', (e) => {
  if (e.target.classList?.contains('modal-backdrop')) closeLogin();
});

// Magic link
loginSend.addEventListener('click', async () => {
  const email = (loginEmailInput.value || '').trim();
  if (!email){ alert('Podaj adres e-mail.'); return; }

  // Strona, na którą wróci link (możesz zmienić na index.html jeśli wolisz)
  const redirectTo = location.origin + location.pathname; 
  // na GH Pages zwykle będzie: https://dmatysiek.github.io/szablonopis/sales.html

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo }
  });

  if (error){
    alert('Błąd wysyłki linku: ' + error.message);
    return;
  }
  closeLogin();
  alert('Wysłaliśmy link logowania. Sprawdź e-mail i kliknij link na tym urządzeniu.');
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
  renderUser(null);
  closeMenu();
});

// Inicjalizacja: wykryj sesję/magic-link
(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  renderUser(session?.user || null);

  // nasłuch zmian sesji (logowanie/wylogowanie)
  supabase.auth.onAuthStateChange((_event, session) => {
    renderUser(session?.user || null);
  });
})();
