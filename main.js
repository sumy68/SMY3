// ==============================
// SMY AGENCY – CLEAN VERSION
// Optimized JS with better performance
// ==============================

// ==============================
// HEADER & FOOTER LOADING
// ==============================
const loadPartial = async (url, position) => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    document.body.insertAdjacentHTML(position, html);
    return true;
  } catch (error) {
    console.error(`Failed to load ${url}:`, error);
    return false;
  }
};

// Load header
loadPartial('/partials/header.html', 'afterbegin');

// Load footer
loadPartial('/partials/footer.html', 'beforeend').then(() => {
  // Update year
  const yearEl = document.getElementById('wq-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
  
  // Footer curtain animation
  const footer = document.querySelector('.footer-curtain');
  if (footer) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          footer.classList.add('is-visible');
          observer.unobserve(footer);
        }
      });
    }, { threshold: 0.2 });
    
    observer.observe(footer);
  }
});

// ==============================
// MOBILE NAV TOGGLE
// ==============================
document.addEventListener('click', (e) => {
  const toggle = document.querySelector('.wq-nav-toggle');
  const nav = document.querySelector('.wq-nav');
  
  if (!toggle || !nav) return;
  
  if (toggle.contains(e.target)) {
    nav.classList.toggle('is-open');
    toggle.setAttribute(
      'aria-expanded',
      nav.classList.contains('is-open')
    );
  } else if (!nav.contains(e.target) && nav.classList.contains('is-open')) {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

// ==============================
// ROTATING WORD (OPTIMIZED)
// ==============================
const initRotatingWord = () => {
  const words = ['designen', 'entwickeln', 'drucken', 'optimieren', 'vermarkten'];
  const element = document.getElementById('rotatingWord');
  
  if (!element) return;
  
  let currentIndex = 0;
  
  const rotateWord = () => {
    element.classList.add('fade-out');
    
    setTimeout(() => {
      currentIndex = (currentIndex + 1) % words.length;
      element.textContent = words[currentIndex];
      element.classList.remove('fade-out');
    }, 300);
  };
  
  setInterval(rotateWord, 2000);
};

// ==============================
// COUNTER ANIMATION (OPTIMIZED)
// ==============================
const initCounters = () => {
  const counters = document.querySelectorAll('[data-count]');
  
  if (!counters.length) return;
  
  const animateCounter = (element, target) => {
    const duration = 1500;
    const start = performance.now();
    const suffix = element.querySelector('.stat__number').textContent.replace(/[0-9]/g, '');
    
    const updateCounter = (currentTime) => {
      const elapsed = currentTime - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeOutCubic * target);
      
      element.querySelector('.stat__number').textContent = current + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };
    
    requestAnimationFrame(updateCounter);
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.animated) {
        const target = parseInt(entry.target.dataset.count);
        animateCounter(entry.target, target);
        entry.target.dataset.animated = 'true';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  counters.forEach(counter => observer.observe(counter));
};

// ==============================
// SMOOTH SCROLL FOR ANCHOR LINKS
// ==============================
const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
};

// ==============================
// INTERSECTION OBSERVER FOR FADE-IN
// ==============================
const initFadeInAnimation = () => {
  const elements = document.querySelectorAll('.fade-in-up');
  
  if (!elements.length) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });
  
  elements.forEach(el => observer.observe(el));
};

// ==============================
// HEADER SCROLL EFFECT
// ==============================
const initHeaderScroll = () => {
  const header = document.querySelector('.wq-header');
  if (!header) return;
  
  let lastScroll = 0;
  
  const handleScroll = () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
};

// ==============================
// INIT ALL ON DOM READY
// ==============================
const init = () => {
  initRotatingWord();
  initCounters();
  initSmoothScroll();
  initFadeInAnimation();
  initHeaderScroll();
};

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ==============================
// PERFORMANCE MONITORING (DEV ONLY)
// ==============================
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.addEventListener('load', () => {
    if (window.performance) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log('Page Load Time:', pageLoadTime + 'ms');
    }
  });
}