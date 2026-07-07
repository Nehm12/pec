// ═══════════════════════════════════════════════════════
//   hero-video.js — Vidéo premium du hero PEC
//   Gère reduced-motion, mobile/connexion lente et parallax léger
// ═══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    const hero = document.querySelector('.hero');
    const video = document.querySelector('.hero-video');

    if (!hero || !video) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobileQuery = window.matchMedia('(max-width: 768px)');
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

    // Évite de charger une vidéo lourde sur mobile contraint ou connexion faible.
    function shouldUsePosterOnly() {
        const saveData = connection && connection.saveData;
        const slowConnection = connection && ['slow-2g', '2g', '3g'].includes(connection.effectiveType);

        return reduceMotion.matches || saveData || (mobileQuery.matches && slowConnection);
    }

    function clearVideoSources() {
        video.pause();
        video.removeAttribute('src');
        video.querySelectorAll('source').forEach(source => source.removeAttribute('src'));
        video.load();
    }

    function setVideoSources() {
        const desktopMp4 = video.dataset.desktopMp4;
        const desktopWebm = video.dataset.desktopWebm;
        const mobileMp4 = video.dataset.mobileMp4;
        const useMobileFile = mobileQuery.matches && mobileMp4;
        const sources = video.querySelectorAll('source');

        if (sources[0]) sources[0].src = useMobileFile ? mobileMp4 : desktopMp4;
        if (sources[1]) sources[1].src = desktopWebm;
    }

    function bootVideo() {
        if (shouldUsePosterOnly()) {
            hero.classList.add(reduceMotion.matches ? 'video-reduced-motion' : 'video-fallback');
            clearVideoSources();
            return;
        }

        hero.classList.remove('video-fallback', 'video-reduced-motion');
        setVideoSources();
        video.load();

        const playPromise = video.play();
        if (playPromise) {
            playPromise.catch(() => {
                hero.classList.add('video-fallback');
                clearVideoSources();
            });
        }
    }

    video.addEventListener('canplay', () => {
        hero.classList.add('video-ready');
    }, { once: true });

    video.addEventListener('error', () => {
        hero.classList.add('video-fallback');
    });

    bootVideo();

    reduceMotion.addEventListener('change', bootVideo);
    mobileQuery.addEventListener('change', bootVideo);
    if (connection && connection.addEventListener) {
        connection.addEventListener('change', bootVideo);
    }

    // Parallax léger piloté par requestAnimationFrame pour éviter les reflows au scroll.
    let ticking = false;

    function updateParallax() {
        ticking = false;

        if (reduceMotion.matches || hero.classList.contains('video-fallback')) return;

        const rect = hero.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;

        const progress = Math.min(Math.max(-rect.top / rect.height, 0), 1);
        video.style.transform = `translate3d(0, ${progress * 34}px, 0) scale(1.035)`;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }, { passive: true });

    window.addEventListener('resize', updateParallax, { passive: true });
});
