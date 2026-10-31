(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Année dynamique ---------- */
  $('#year').textContent = new Date().getFullYear();

  /* ---------- Thème clair / sombre ---------- */
  const themeBtn = $('#themeToggle');
  const applyThemeUI = () => {
    const dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.innerHTML = dark
      ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
    themeBtn.setAttribute('aria-label', dark ? 'Activer le mode clair' : 'Activer le mode sombre');
  };
  themeBtn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* stockage indisponible */ }
    applyThemeUI();
  });
  applyThemeUI();

  /* ---------- Menu mobile ---------- */
  const menuBtn = $('#menuToggle');
  const nav = $('#primaryNav');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    menuBtn.innerHTML = open
      ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
  };
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('.nav-link').forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); menuBtn.focus(); }
  });

  /* ---------- Défilement : progression, en-tête, retour en haut ---------- */
  const progress = $('#scrollProgress');
  const header = $('#siteHeader');
  const toTop = $('#toTop');
  let ticking = false;
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    progress.style.transform = 'scaleX(' + ratio + ')';
    header.classList.toggle('is-scrolled', window.scrollY > 10);
    toTop.hidden = window.scrollY < 500;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  $$('[data-top]').forEach((btn) =>
    btn.addEventListener('click', () =>
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
    )
  );

  /* ---------- Apparition au défilement ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const revealObs = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el) => revealObs.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('in'));
  }

  /* ---------- Section active dans la navigation ---------- */
  const links = $$('.nav-link');
  const sections = links.map((l) => $(l.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const navObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((l) => {
            const active = l.getAttribute('href') === '#' + entry.target.id;
            l.classList.toggle('is-active', active);
            if (active) l.setAttribute('aria-current', 'true'); else l.removeAttribute('aria-current');
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => navObs.observe(s));
  }

  /* ---------- Photo de profil : repli sur les initiales ---------- */
  const photo = $('#profilePhoto');
  const fallback = $('#photoFallback');
  const showFallback = () => { photo.style.display = 'none'; fallback.style.display = 'grid'; };
  photo.addEventListener('error', showFallback);
  if (photo.complete && photo.naturalWidth === 0) showFallback();

  /* ---------- Filtrage des projets ---------- */
  const filterBtns = $$('.filter-btn');
  const projects = $$('#projectGrid .project');
  const emptyMsg = $('#emptyMsg');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      filterBtns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      let visible = 0;
      projects.forEach((card) => {
        const match = filter === 'all' || card.dataset.tech.split(' ').includes(filter);
        card.hidden = !match;
        if (match) { visible++; card.classList.add('in'); }
      });
      emptyMsg.hidden = visible !== 0;
    });
  });

  /* ---------- Formulaire de contact ---------- */
  const form = $('#contactForm');
  const status = $('#formStatus');
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const rules = {
    name: (v) => (v.length < 2 ? 'Veuillez saisir votre nom (2 caractères minimum).' : ''),
    email: (v) => (!emailRe.test(v) ? 'Veuillez saisir une adresse email valide.' : ''),
    subject: (v) => (v.length < 3 ? 'Veuillez indiquer un sujet (3 caractères minimum).' : ''),
    message: (v) => (v.length < 10 ? 'Votre message doit contenir au moins 10 caractères.' : '')
  };

  const validateField = (input) => {
    const msg = rules[input.name](input.value.trim());
    const field = input.closest('.field');
    $('.error', field).textContent = msg;
    field.classList.toggle('has-error', Boolean(msg));
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    return !msg;
  };

  const inputs = $$('input, textarea', form);
  inputs.forEach((input) => {
    input.addEventListener('blur', () => validateField(input));
    input.addEventListener('input', () => {
      if (input.closest('.field').classList.contains('has-error')) validateField(input);
    });
  });

  const setStatus = (text, type) => {
    status.textContent = text;
    status.className = 'form-status' + (type ? ' is-' + type : '');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', '');
    const results = inputs.map(validateField);
    if (results.includes(false)) {
      inputs[results.indexOf(false)].focus();
      setStatus('Veuillez corriger les champs signalés.', 'error');
      return;
    }

    const endpoint = form.dataset.endpoint.trim();

    // Aucun service configuré : on ne prétend pas envoyer d'email.
    if (!endpoint) {
      setStatus('Formulaire valide, mais aucun service d\'envoi n\'est configuré : votre message n\'a pas été envoyé. Renseignez data-endpoint (Formspree) dans index.html.', 'error');
      return;
    }

    // Envoi réel via Formspree (ou tout service acceptant un POST de formulaire)
    const submitBtn = $('button[type="submit"]', form);
    submitBtn.disabled = true;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error('Réponse ' + res.status);
      form.reset();
      setStatus('Merci ! Votre message a bien été envoyé.', 'success');
    } catch (err) {
      setStatus('Une erreur est survenue lors de l\'envoi. Réessayez ou écrivez-moi directement par email.', 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
})();