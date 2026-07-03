// ═══════════════════════════════════════════════════════
//   script.js — Interactions du portfolio PEC
//   Déclenché après chargement complet du DOM
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

    // ── Année dynamique dans le footer ──
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // ── Calcul automatique des années d'expérience ──
    // Lit data-target="15", recalcule depuis 2009 jusqu'à l'année courante
    const experienceStat = document.querySelector('[data-target="15"]');
    if (experienceStat) {
        const startYear = 2009;
        const currentYear = new Date().getFullYear();
        experienceStat.setAttribute('data-target', currentYear - startYear);
    }

    // ── Navigation smooth scroll (ancres) ──
    // Intercepte les clics sur les liens de navigation pour un défilement fluide
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // compense la hauteur du nav
                    behavior: 'smooth'
                });
            }
        });
    });

    // ── Animation de la navbar au scroll ──
    // Ajoute la classe 'scrolled' quand le hero est dépassé
    const nav = document.querySelector('nav');
    const logoLetters = document.querySelectorAll('.logo-letter');
    const hero = document.querySelector('.hero');

    function updateNav() {
        const heroBottom = hero.offsetTop + hero.offsetHeight;
        const scrolled = window.scrollY > heroBottom - 200;

        nav.classList.toggle('scrolled', scrolled);

        // Les lettres du logo PEC réapparaissent une par une
        logoLetters.forEach((letter, i) => {
            setTimeout(() => {
                letter.classList.toggle('visible', scrolled);
            }, i * 100);
        });
    }

    // Affiche les lettres du logo PEC au bout de 2.5s (après l'animation d'entrée)
    setTimeout(() => {
        logoLetters.forEach(l => l.classList.add('visible'));
    }, 2500);

    window.addEventListener('scroll', updateNav);

    // ── Compteurs de statistiques animés ──
    // Les nombres augmentent de 0 à leur cible quand la section apparaît
    const stats = document.querySelectorAll('.stat-number');
    const statsObserverOptions = {
        threshold: 0.5
    };

    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateValue(entry.target, 0, target, 2000);
                entry.target.classList.add('animated');
            }
        });
    }, statsObserverOptions);

    stats.forEach(stat => statsObserver.observe(stat));

    // Animateur de compteur (incrémente de start à end sur duration ms)
    function animateValue(obj, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                obj.innerHTML = end + '+';
            }
        };
        window.requestAnimationFrame(step);
    }

    // ── Formulaire de contact (simulation d'envoi) ──
    // Affiche un message de confirmation temporaire après 1.5s
    const contactForm = document.getElementById('pec-form');
    const formFeedback = document.getElementById('form-feedback');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.textContent;

            btn.textContent = 'Envoi en cours...';
            btn.disabled = true;

            // Simule un délai d'envoi (pas de backend pour l'instant)
            setTimeout(() => {
                contactForm.reset();
                btn.textContent = originalText;
                btn.disabled = false;

                formFeedback.style.display = 'block';
                formFeedback.style.color = '#15803d';
                formFeedback.textContent = 'Merci ! Votre message a été envoyé avec succès.';

                // Cache le message après 5 secondes
                setTimeout(() => {
                    formFeedback.style.display = 'none';
                }, 5000);
            }, 1500);
        });
    }

    // ── Bouton retour en haut (back-to-top) ──
    // Apparaît après 500px de scroll
    const backToTop = document.getElementById('back-to-top');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 500) {
            backToTop.style.display = 'flex';
            backToTop.style.alignItems = 'center';
            backToTop.style.justifyContent = 'center';
        } else {
            backToTop.style.display = 'none';
        }
    });

    backToTop.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // ── Révélation au scroll (IntersectionObserver) ──
    // Les éléments apparaissent avec un léger décalage vers le haut
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.expertise-card, .realisation-card, .about-card, .coach-grid');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });

});
