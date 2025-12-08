document.addEventListener('DOMContentLoaded', () => {
  const html = document.documentElement;

  // --- Theme Toggle ---
  const toggle = document.getElementById('toggle');
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    html.classList.add('light');
  }
  // reflect initial state for a11y
  if (toggle) toggle.setAttribute('aria-checked', String(html.classList.contains('light')));

  toggle.addEventListener('click', () => {
    // apply scoped transition class just for the theme change window
    html.classList.add('theme-transition');
    const isLight = html.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    toggle.setAttribute('aria-checked', String(isLight));
    // remove transition class after animation completes
    window.setTimeout(() => html.classList.remove('theme-transition'), 360);
  });

  // --- AOS (Animate On Scroll) init with mobile-safe options ---
  (function initAOS(){
    if (!window.AOS) return;
    try {
      AOS.init({
        // Respect user motion preferences on any device
        disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        startEvent: 'DOMContentLoaded',
        once: true,
        duration: 700,
        easing: 'ease-out',
        offset: 0, // trigger earlier on small screens
        anchorPlacement: 'top-bottom'
      });
      // Recalculate positions after assets load or orientation changes
      window.addEventListener('load', () => AOS.refresh());
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => AOS.refresh());
      }
      window.addEventListener('orientationchange', () => setTimeout(() => AOS.refreshHard(), 250));
    } catch (e) {
      console.error('AOS init failed:', e);
    }
  })();

  // --- Render Skill Dots ---
  document.querySelectorAll('.dots').forEach(d => {
    const level = parseInt(d.dataset.level || 0);
    d.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      const el = document.createElement('span');
      if (i < level) el.classList.add('active');
      d.appendChild(el);
    }
  });

  // --- Smooth Scrolling for Nav Links ---
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });

  // --- Scroll Animations with Intersection Observer ---
  const animatedElements = document.querySelectorAll('[data-animate]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target); // Optional: stop observing once animated
      }
    });
  }, {
    threshold: 0.1 // Trigger when 10% of the element is visible
  });

  animatedElements.forEach(el => observer.observe(el));
  
  // --- Hero typewriter effect ---
  (function initTypewriter(){
    const els = document.querySelectorAll('.text-type[data-texts]');
    if (!els.length) return;

    const init = (el) => {
      let texts;
      try { texts = JSON.parse(el.dataset.texts || '[]'); } catch { texts = []; }
      if (!Array.isArray(texts) || texts.length === 0) return;

      const typingSpeed = parseInt(el.dataset.typingSpeed || '50', 10);
      const deletingSpeed = parseInt(el.dataset.deletingSpeed || '30', 10);
      const pause = parseInt(el.dataset.pause || '2000', 10);
      const loop = (el.dataset.loop || 'true') !== 'false';
      const showCursor = (el.dataset.showCursor || 'true') !== 'false';
      const cursorChar = el.dataset.cursor || '|';
      const startOnVisible = (el.dataset.startOnVisible || 'false') === 'true';

      let textIndex = 0, charIndex = 0, isDeleting = false, handle;

      let cursorEl;
      if (showCursor) {
        cursorEl = document.createElement('span');
        cursorEl.className = 'text-type__cursor';
        cursorEl.textContent = cursorChar;
        el.insertAdjacentElement('afterend', cursorEl);
      }

      const step = () => {
        const full = texts[textIndex];
        if (!isDeleting) {
          el.textContent = full.substring(0, charIndex + 1);
          charIndex++;
          if (charIndex === full.length) {
            if (!loop && textIndex === texts.length - 1) return; // stop at end if not looping
            isDeleting = true;
            handle = setTimeout(step, pause);
            return;
          }
          handle = setTimeout(step, typingSpeed);
        } else {
          el.textContent = full.substring(0, charIndex - 1);
          charIndex--;
          if (charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            handle = setTimeout(step, 300);
            return;
          }
          handle = setTimeout(step, deletingSpeed);
        }
      };

      const start = () => step();
      if (startOnVisible) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach(e => { if (e.isIntersecting) { io.disconnect(); start(); } });
        }, { threshold: 0.1 });
        io.observe(el);
      } else {
        start();
      }

      return () => clearTimeout(handle);
    };

    els.forEach(init);
  })();
});

// --- Contact Form with EmailJS ---
const contactForm = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');

  if (contactForm) {
    // Initialize EmailJS with your Public Key
    emailjs.init('8_VsjgD-Gh8FMTDUn');

    contactForm.addEventListener('submit', function(e) {
      e.preventDefault(); // Prevent the default form submission (page reload)

      // Change button text and disable it to prevent multiple submissions
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      // Send the form data using your EmailJS credentials
      emailjs.sendForm('service_vvfb85q', 'template_q6dupu2', this)
        .then(() => {
          alert('Message sent successfully!');
          contactForm.reset(); // Clear the form fields
        }, (err) => {
          alert('Failed to send message. Please try again later.');
          console.error('EmailJS Error:', JSON.stringify(err));
        }).finally(() => {
          // Re-enable the button and restore its original text
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message';
        });
    });
  }



