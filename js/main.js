/**
 * Web Freelancers - Main JavaScript
 * Handles:
 * 1. Strict Bilingual Isolation (ENG vs தமிழ்)
 * 2. Mobile Drawer Navigation & Backdrop Overlay
 * 3. Interactive Pricing & Quote Calculator
 * 4. FAQ Accordion
 * 5. Portfolio Filter
 * 6. High-Res Flyer Modal
 * 7. WhatsApp Contact Integration
 * 8. Scroll to Top
 */

document.addEventListener('DOMContentLoaded', () => {
  initLanguageSwitcher();
  initNavbar();
  initQuoteCalculator();
  initFaqAccordion();
  initPortfolioFilter();
  initFlyerModal();
  initContactForm();
  initScrollTop();
});

/* ==========================================================================
   1. Language Switcher (Strict English vs. Tamil Isolation)
   ========================================================================== */
function initLanguageSwitcher() {
  const langBtns = document.querySelectorAll('.lang-btn');
  let currentLang = localStorage.getItem('wf_lang') || 'en';

  window.setLanguage = function(lang) {
    if (lang !== 'en' && lang !== 'ta') lang = 'en';
    currentLang = lang;
    localStorage.setItem('wf_lang', lang);

    // Apply body class
    document.body.classList.remove('lang-en', 'lang-ta');
    document.body.classList.add('lang-' + lang);

    // Set HTML lang attribute
    document.documentElement.lang = lang;

    // Update active button state
    langBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update form input placeholders if present
    updateFormPlaceholders(lang);

    // Re-trigger quote calculator to update WhatsApp message language
    if (typeof window.recalcQuote === 'function') {
      window.recalcQuote();
    }
  };

  langBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.setLanguage(btn.dataset.lang);
    });
  });

  // Initialize on page load
  window.setLanguage(currentLang);
}

function updateFormPlaceholders(lang) {
  const nameInput = document.getElementById('contactName');
  const phoneInput = document.getElementById('contactPhone');
  const msgInput = document.getElementById('contactMessage');

  if (lang === 'ta') {
    if (nameInput) nameInput.placeholder = 'உங்கள் பெயர் (உதா: ரமேஷ் குமார்)';
    if (phoneInput) phoneInput.placeholder = '+91 75300 18721';
    if (msgInput) msgInput.placeholder = 'உங்கள் தொழில் பற்றிய விவரங்கள் மற்றும் தேவைகளை இங்கே குறிப்பிடவும்...';
  } else {
    if (nameInput) nameInput.placeholder = 'e.g. Ramesh Kumar';
    if (phoneInput) phoneInput.placeholder = '+91 98765 43210';
    if (msgInput) msgInput.placeholder = 'Describe your business, how many pages you need, or reference websites...';
  }
}

/* ==========================================================================
   2. Navbar & Mobile Drawer Navigation
   ========================================================================== */
function initNavbar() {
  const header = document.querySelector('.header');
  const menuToggle = document.querySelector('.menu-toggle');
  const navMenu = document.querySelector('.nav-menu');

  // Create backdrop element if not already in DOM
  let backdrop = document.querySelector('.nav-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);
  }

  // Sticky header scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 25) {
      header?.classList.add('scrolled');
    } else {
      header?.classList.remove('scrolled');
    }
  });

  const openMenu = () => {
    navMenu?.classList.add('open');
    backdrop?.classList.add('open');
    menuToggle?.setAttribute('aria-expanded', 'true');
    if (menuToggle) menuToggle.innerHTML = '&#10005;';
    document.body.style.overflow = 'hidden'; // Prevent background scroll on mobile
  };

  const closeMenu = () => {
    navMenu?.classList.remove('open');
    backdrop?.classList.remove('open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    if (menuToggle) menuToggle.innerHTML = '&#9776;';
    document.body.style.overflow = '';
  };

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navMenu.classList.contains('open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    backdrop.addEventListener('click', closeMenu);

    // Close when clicking any nav link
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        closeMenu();
      }
    });
  }
}

/* ==========================================================================
   3. Interactive Price & Quote Calculator
   ========================================================================== */
function initQuoteCalculator() {
  const form = document.getElementById('quoteCalcForm');
  if (!form) return;

  const totalEl = document.getElementById('calcTotalDisplay');
  const serviceSummaryEl = document.getElementById('calcSummaryService');
  const addOnsSummaryEl = document.getElementById('calcSummaryAddons');
  const durationSummaryEl = document.getElementById('calcSummaryDuration');
  const waQuoteBtn = document.getElementById('calcWaQuoteBtn');

  window.recalcQuote = function() {
    const isTamil = document.body.classList.contains('lang-ta');

    // 1. Get base package
    const selectedService = form.querySelector('input[name="serviceType"]:checked');
    const basePrice = parseInt(selectedService?.value || '7999', 10);
    const serviceName = isTamil 
      ? (selectedService?.dataset.nameTa || selectedService?.dataset.name)
      : (selectedService?.dataset.name || 'Standard Business Website');
    const baseDays = isTamil ? (selectedService?.dataset.daysTa || '5-7 நாட்கள்') : (selectedService?.dataset.days || '5-7 Days');

    // 2. Add-ons
    let addonsTotal = 0;
    let selectedAddons = [];
    form.querySelectorAll('input[name="addons"]:checked').forEach(cb => {
      addonsTotal += parseInt(cb.value, 10);
      selectedAddons.push(isTamil ? (cb.dataset.nameTa || cb.dataset.name) : cb.dataset.name);
    });

    const grandTotal = basePrice + addonsTotal;

    // 3. Update DOM
    if (totalEl) totalEl.textContent = '₹' + grandTotal.toLocaleString('en-IN');
    if (serviceSummaryEl) serviceSummaryEl.textContent = `${serviceName} (₹${basePrice.toLocaleString('en-IN')})`;
    if (addOnsSummaryEl) {
      if (selectedAddons.length > 0) {
        addOnsSummaryEl.textContent = isTamil
          ? `${selectedAddons.length} வசதிகள் (+₹${addonsTotal.toLocaleString('en-IN')})`
          : `${selectedAddons.length} Selected (+₹${addonsTotal.toLocaleString('en-IN')})`;
      } else {
        addOnsSummaryEl.textContent = isTamil ? 'எதுவும் இல்லை' : 'None selected';
      }
    }
    if (durationSummaryEl) durationSummaryEl.textContent = baseDays;

    // 4. Update WhatsApp Direct Link
    if (waQuoteBtn) {
      let waMessage;
      if (isTamil) {
        waMessage = `வணக்கம் Web Freelancers! உங்கள் இணையதளத்தில் இருந்து கட்டண விவரம் கணக்கிட்டேன்:%0A%0A` +
          `*பேக்கேஜ்:* ${encodeURIComponent(serviceName)}%0A` +
          `*கூடுதல் வசதிகள்:* ${encodeURIComponent(selectedAddons.length > 0 ? selectedAddons.join(', ') : 'எதுவும் இல்லை')}%0A` +
          `*மதிப்பிடப்பட்ட கட்டணம்:* ₹${grandTotal.toLocaleString('en-IN')}%0A` +
          `*டெலிவரி காலம்:* ${encodeURIComponent(baseDays)}%0A%0A` +
          `மேலதிக விவரங்களை பகிர்ந்து கொள்ளவும்.`;
      } else {
        waMessage = `Hello Web Freelancers! I calculated a project quote on your website:%0A%0A` +
          `*Package:* ${encodeURIComponent(serviceName)}%0A` +
          `*Add-ons:* ${encodeURIComponent(selectedAddons.length > 0 ? selectedAddons.join(', ') : 'None')}%0A` +
          `*Estimated Price:* ₹${grandTotal.toLocaleString('en-IN')}%0A` +
          `*Delivery Time:* ${encodeURIComponent(baseDays)}%0A%0A` +
          `Please provide more details on how to proceed.`;
      }

      waQuoteBtn.href = `https://wa.me/917530018721?text=${waMessage}`;
    }
  };

  form.addEventListener('change', window.recalcQuote);
  window.recalcQuote();
}

/* ==========================================================================
   4. FAQ Accordion
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (question && answer) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all others
        faqItems.forEach(other => {
          if (other !== item) {
            other.classList.remove('active');
            const otherAns = other.querySelector('.faq-answer');
            if (otherAns) otherAns.style.maxHeight = null;
          }
        });

        // Toggle current
        if (isActive) {
          item.classList.remove('active');
          answer.style.maxHeight = null;
        } else {
          item.classList.add('active');
          answer.style.maxHeight = answer.scrollHeight + 30 + 'px';
        }
      });
    }
  });
}

/* ==========================================================================
   5. Portfolio Category Filter
   ========================================================================== */
function initPortfolioFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioCards = document.querySelectorAll('.portfolio-card');

  if (filterBtns.length === 0 || portfolioCards.length === 0) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      portfolioCards.forEach(card => {
        const cat = card.dataset.category;
        if (filter === 'all' || cat === filter) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   6. Flyer Modal Preview
   ========================================================================== */
function initFlyerModal() {
  const modal = document.getElementById('flyerModal');
  const modalImg = document.getElementById('flyerModalImg');
  const closeBtn = document.getElementById('flyerModalClose');
  const flyerTriggers = document.querySelectorAll('[data-flyer-src]');

  if (!modal || !modalImg) return;

  flyerTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const src = trigger.getAttribute('data-flyer-src');
      modalImg.src = src;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  const closeModal = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  };

  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}

/* ==========================================================================
   7. Contact Form Handler (Direct to WhatsApp)
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const isTamil = document.body.classList.contains('lang-ta');
    const name = form.querySelector('[name="name"]')?.value.trim();
    const phone = form.querySelector('[name="phone"]')?.value.trim();
    const service = form.querySelector('[name="service"]')?.value;
    const message = form.querySelector('[name="message"]')?.value.trim();

    if (!name || !phone) {
      alert(isTamil ? 'தயவுசெய்து உங்கள் பெயர் மற்றும் தொலைபேசி எண்ணை உள்ளிடவும்.' : 'Please enter your Name and Phone Number.');
      return;
    }

    let waText;
    if (isTamil) {
      waText = `வணக்கம் Web Freelancers!%0A%0A` +
        `*பெயர்:* ${encodeURIComponent(name)}%0A` +
        `*தொலைபேசி எண்:* ${encodeURIComponent(phone)}%0A` +
        `*தேவையான சேவை:* ${encodeURIComponent(service || 'Website Development')}%0A` +
        `*தேவை / விவரம்:* ${encodeURIComponent(message || 'என் திட்டத்தை பற்றி பேச விரும்புகிறேன்.')}`;
    } else {
      waText = `Hello Web Freelancers!%0A%0A` +
        `*Name:* ${encodeURIComponent(name)}%0A` +
        `*Phone:* ${encodeURIComponent(phone)}%0A` +
        `*Service Required:* ${encodeURIComponent(service || 'Website Development')}%0A` +
        `*Project Details:* ${encodeURIComponent(message || 'I would like to discuss my project.')}`;
    }

    // Open WhatsApp in new tab
    const waUrl = `https://wa.me/917530018721?text=${waText}`;
    window.open(waUrl, '_blank');

    // Show friendly success confirmation on page
    const alertBox = document.createElement('div');
    alertBox.style.marginTop = '16px';
    alertBox.style.padding = '14px 18px';
    alertBox.style.backgroundColor = '#ecfdf5';
    alertBox.style.border = '1px solid #10b981';
    alertBox.style.color = '#065f46';
    alertBox.style.borderRadius = '8px';
    alertBox.style.fontWeight = '600';
    alertBox.style.fontSize = '0.95rem';

    if (isTamil) {
      alertBox.innerHTML = `✓ நன்றி ${name}! வாட்ஸ்அப் சாட் திறக்கப்பட்டுள்ளது. நீங்கள் நேரடியாகவும் அழைக்கலாம்: <a href="tel:+917530018721" style="color:#059669; text-decoration:underline;">+91 7530018721</a>.`;
    } else {
      alertBox.innerHTML = `✓ Thank you ${name}! WhatsApp chat has been opened. You can also directly call us at <a href="tel:+917530018721" style="color:#059669; text-decoration:underline;">+91 7530018721</a>.`;
    }

    form.appendChild(alertBox);
    form.reset();

    setTimeout(() => {
      alertBox.remove();
    }, 12000);
  });
}

/* ==========================================================================
   8. Scroll To Top Button
   ========================================================================== */
function initScrollTop() {
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  if (!scrollTopBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}
