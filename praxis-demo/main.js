// Mobile nav
const burger = document.querySelector("[data-burger]");
const drawer = document.querySelector("[data-drawer]");
const closeBtn = document.querySelector("[data-close]");
const drawerLinks = document.querySelector("[data-drawer-links]");

function openDrawer() {
  drawer.classList.add("is-open");
  burger?.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  drawer.classList.remove("is-open");
  burger?.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
}

burger?.addEventListener("click", () => {
  if (drawer.classList.contains("is-open")) closeDrawer();
  else openDrawer();
});

closeBtn?.addEventListener("click", closeDrawer);

drawer?.addEventListener("click", (e) => {
  if (e.target === drawer) closeDrawer();
});

drawerLinks?.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a) return;
  closeDrawer();
});

// Smooth scroll
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute("href");
  if (!id || id === "#") return;
  const el = document.querySelector(id);
  if (!el) return;
  e.preventDefault();
  el.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Year
const yearEl = document.querySelector("[data-year]");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Form (with Formspree integration)
const form = document.querySelector("[data-form]");
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const button = form.querySelector('button[type="submit"]');
  if (!button) return;
  
  const originalHTML = button.innerHTML;
  button.innerHTML = '<span>✓ Wird gesendet...</span>';
  button.disabled = true;
  button.style.background = 'linear-gradient(135deg, #4f8cff, #7c5cff)';
  button.style.opacity = '0.7';
  
  try {
    // Send to Formspree
    const formData = new FormData(form);
    const response = await fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      // Success
      button.innerHTML = '<span>✓ Anfrage gesendet!</span>';
      button.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      button.style.opacity = '1';
      
      setTimeout(() => {
        alert("Vielen Dank für Ihre Anfrage!\n\nWir melden uns innerhalb von 24 Stunden bei Ihnen zurück.");
        button.innerHTML = originalHTML;
        button.disabled = false;
        button.style.background = '';
        button.style.opacity = '';
        form.reset();
      }, 1500);
    } else {
      // Error
      throw new Error('Formspree response not ok');
    }
  } catch (error) {
    console.error('Form submission error:', error);
    button.innerHTML = '<span>❌ Fehler - Bitte erneut versuchen</span>';
    button.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.disabled = false;
      button.style.background = '';
      button.style.opacity = '';
    }, 3000);
    
    alert("Es gab einen Fehler beim Senden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt per E-Mail: info@smyagency.de");
  }
});

// Scroll animations for cards
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Animate elements on scroll
document.querySelectorAll('.feature-card, .price-card, .result-card, .process-step, .comparison__side').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

/* ===== RESPONSIVE ===== */