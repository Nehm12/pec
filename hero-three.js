// ─── IMPORTATION THREE.JS ───────────────────────────
// Charge le moteur 3D depuis le CDN via importmap (défini dans index.html)
import * as THREE from 'three';

// ═══════════════════════════════════════════════════════
//                    CONFIGURATION
// ═══════════════════════════════════════════════════════

const hero = document.querySelector('.hero');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
const hasWebGL = detectWebGL();
const hasWebGL2 = detectWebGL2();
const deviceMemory = navigator.deviceMemory || 8;
const lowPowerMode = !hasWebGL2 || isTouch || deviceMemory <= 4;

if (!hero || !hasWebGL) {
    applyStaticFallback();
} else {
    initHeroScene();
}

function detectWebGL() {
    try {
        const canvas = document.createElement('canvas');
        return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch {
        return false;
    }
}

function detectWebGL2() {
    try {
        const canvas = document.createElement('canvas');
        return Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
    } catch {
        return false;
    }
}

function applyStaticFallback() {
    if (hero) hero.classList.add('hero-static-fallback');
}

// ═══════════════════════════════════════════════════════
//                    INITIALISATION
// ═══════════════════════════════════════════════════════

function initHeroScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050607);
    scene.fog = new THREE.FogExp2(0x050607, 0.055);

    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
    const cameraStart = new THREE.Vector3(8.5, 5.2, 12.5);
    const cameraFinal = new THREE.Vector3(5.8, 3.1, 7.2);
    const cameraTarget = new THREE.Vector3(0, -0.3, -1.8);
    camera.position.copy(prefersReducedMotion ? cameraFinal : cameraStart);
    camera.lookAt(cameraTarget);

    const renderer = new THREE.WebGLRenderer({
        antialias: !lowPowerMode,
        alpha: true,
        powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(pixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !lowPowerMode;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.className = 'hero-three-canvas';
    hero.style.position = 'relative';
    hero.insertBefore(canvas, hero.firstChild);

    const disposables = [];
    const animated = {
        coachArm: null,
        coachHand: null,
        particles: null,
        particleVelocities: null,
        dustCount: 0,
        brandOrbs: [],
        halos: [],
        ball: null,
    };

    const materials = createMaterials(disposables);

    createLights(scene, animated, disposables);
    createRugbyField(scene, materials, disposables);
    createRugbyPosts(scene, materials, disposables);
    createCoach(scene, materials, animated, disposables);
    createBrandOrbs(scene, materials, animated, disposables);
    createAtmosphere(scene, materials, animated, disposables);

    const mouse = new THREE.Vector2(0, 0);
    const smoothMouse = new THREE.Vector2(0, 0);
    const clock = new THREE.Clock();
    let rafId = null;
    let disposed = false;

    if (!isTouch) {
        window.addEventListener('pointermove', onPointerMove, { passive: true });
    }
    window.addEventListener('resize', onResize);
    window.addEventListener('pagehide', dispose);

    animate();

    // ─── GESTION SOURIS / PARALLAX ───────────────────
    function onPointerMove(event) {
        mouse.x = (event.clientX / window.innerWidth - 0.5) * 2;
        mouse.y = (event.clientY / window.innerHeight - 0.5) * 2;
    }

    // ─── BOUCLE D'ANIMATION ──────────────────────────
    function animate() {
        rafId = requestAnimationFrame(animate);

        const elapsed = clock.getElapsedTime();
        const delta = Math.min(clock.getDelta(), 0.033);
        const entryProgress = prefersReducedMotion ? 1 : easeOutCubic(Math.min(elapsed / 2.8, 1));
        const breath = prefersReducedMotion ? 0 : Math.sin(elapsed * 0.45) * 0.12;

        smoothMouse.lerp(mouse, 0.035);

        const parallaxX = isTouch || prefersReducedMotion ? 0 : smoothMouse.x * 0.42;
        const parallaxY = isTouch || prefersReducedMotion ? 0 : smoothMouse.y * 0.18;
        const desiredCamera = cameraStart.clone().lerp(cameraFinal, entryProgress);
        desiredCamera.x += parallaxX;
        desiredCamera.y += breath - parallaxY;
        desiredCamera.z += Math.sin(elapsed * 0.22) * (prefersReducedMotion ? 0 : 0.16);
        camera.position.lerp(desiredCamera, 0.055);

        const desiredTarget = cameraTarget.clone();
        desiredTarget.x += parallaxX * 0.18;
        desiredTarget.y += parallaxY * 0.08;
        camera.lookAt(desiredTarget);

        animateCoach(animated, elapsed);
        animateBrandOrbs(animated, elapsed);
        animateAtmosphere(animated, elapsed, delta);

        renderer.render(scene, camera);
    }

    // ─── ADAPTATION AU REDIMENSIONNEMENT ─────────────
    function onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(pixelRatio);
    }

    // ─── NETTOYAGE MÉMOIRE ───────────────────────────
    function dispose() {
        if (disposed) return;
        disposed = true;
        cancelAnimationFrame(rafId);
        window.removeEventListener('resize', onResize);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pagehide', dispose);

        const disposedItems = new Set();
        const safeDispose = (item) => {
            if (!item || disposedItems.has(item)) return;
            disposedItems.add(item);
            item.dispose?.();
        };

        scene.traverse((object) => {
            safeDispose(object.geometry);
            if (Array.isArray(object.material)) object.material.forEach(safeDispose);
            else safeDispose(object.material);
        });
        disposables.forEach(safeDispose);
        renderer.dispose();
        canvas.remove();
    }
}

// ═══════════════════════════════════════════════════════
//                    MATÉRIAUX
// ═══════════════════════════════════════════════════════

function createMaterials(disposables) {
    const register = (material) => {
        disposables.push(material);
        return material;
    };

    return {
        grass: register(new THREE.MeshStandardMaterial({
            color: 0x07180f,
            roughness: 0.9,
            metalness: 0.02,
        })),
        grassBand: register(new THREE.MeshStandardMaterial({
            color: 0x0b2416,
            roughness: 0.95,
            metalness: 0,
            transparent: true,
            opacity: 0.5,
        })),
        fieldLine: register(new THREE.LineBasicMaterial({
            color: 0xdcebe5,
            transparent: true,
            opacity: 0.42,
        })),
        fieldLineGold: register(new THREE.LineBasicMaterial({
            color: 0xE8A33D,
            transparent: true,
            opacity: 0.2,
        })),
        post: register(new THREE.MeshStandardMaterial({
            color: 0xd8e4ea,
            roughness: 0.35,
            metalness: 0.2,
            emissive: 0x6d879c,
            emissiveIntensity: 0.08,
        })),
        skin: register(new THREE.MeshStandardMaterial({ color: 0x3a322a, roughness: 0.72 })),
        hair: register(new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })),
        pants: register(new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.82 })),
        jacket: register(new THREE.MeshStandardMaterial({ color: 0x24272a, roughness: 0.68, metalness: 0.12 })),
        shirt: register(new THREE.MeshStandardMaterial({ color: 0x31363a, roughness: 0.7, metalness: 0.08 })),
        shoe: register(new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.9 })),
        ball: register(new THREE.MeshStandardMaterial({
            color: 0x6d351c,
            roughness: 0.68,
            metalness: 0.04,
        })),
        gold: register(new THREE.MeshStandardMaterial({
            color: 0xE8A33D,
            roughness: 0.16,
            metalness: 0.86,
            emissive: 0xE8A33D,
            emissiveIntensity: 0.12,
        })),
        halo: register(new THREE.MeshBasicMaterial({
            color: 0xd6ebff,
            transparent: true,
            opacity: 0.13,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        })),
        dust: register(new THREE.PointsMaterial({
            color: 0xdbeeff,
            size: lowPowerMode ? 0.018 : 0.022,
            transparent: true,
            opacity: 0.26,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        })),
    };
}

// ═══════════════════════════════════════════════════════
//                    LUMIÈRES DE STADE
// ═══════════════════════════════════════════════════════

function createLights(scene, animated, disposables) {
    scene.add(new THREE.AmbientLight(0x101827, 0.28));

    const moonFill = new THREE.DirectionalLight(0x5a86b9, 0.45);
    moonFill.position.set(-5, 5, 7);
    scene.add(moonFill);

    const mainSpot = new THREE.SpotLight(0xdbeeff, 34, 26, Math.PI / 6, 0.42, 1.25);
    mainSpot.position.set(-5.2, 7.2, 2.4);
    mainSpot.target.position.set(0, -1.05, -1.7);
    mainSpot.castShadow = !lowPowerMode;
    mainSpot.shadow.mapSize.set(1024, 1024);
    mainSpot.shadow.camera.near = 1;
    mainSpot.shadow.camera.far = 28;
    scene.add(mainSpot, mainSpot.target);

    const stadiumLights = [
        { x: 5.5, y: 6.2, z: 1.2, intensity: 9 },
        { x: -6.4, y: 5.6, z: -6.5, intensity: 7 },
        { x: 6.2, y: 5.7, z: -6.2, intensity: 7.5 },
    ];

    stadiumLights.forEach((lightData) => {
        const spot = new THREE.SpotLight(0xc9e5ff, lightData.intensity, 30, Math.PI / 7, 0.55, 1.35);
        spot.position.set(lightData.x, lightData.y, lightData.z);
        spot.target.position.set(0, -1.15, -2.2);
        scene.add(spot, spot.target);

        const halo = createLightHalo(lightData.x, lightData.y, lightData.z, disposables);
        scene.add(halo);
        animated.halos.push(halo);
    });
}

function createLightHalo(x, y, z, disposables) {
    const group = new THREE.Group();
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xcfe9ff,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    disposables.push(glowMat);

    for (let i = 0; i < 3; i++) {
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.2 + i * 0.6, 1.2 + i * 0.6), glowMat);
        glow.position.set(0, 0, i * 0.01);
        group.add(glow);
    }

    group.position.set(x, y, z);
    group.lookAt(0, 0, 7);
    return group;
}

// ═══════════════════════════════════════════════════════
//                    TERRAIN DE RUGBY
// ═══════════════════════════════════════════════════════

function createRugbyField(scene, materials, disposables) {
    const field = new THREE.Mesh(new THREE.PlaneGeometry(28, 22), materials.grass);
    field.rotation.x = -Math.PI / 2;
    field.position.set(0, -1.2, 0);
    field.receiveShadow = !lowPowerMode;
    scene.add(field);

    for (let i = -3; i <= 3; i++) {
        const stripe = new THREE.Mesh(new THREE.PlaneGeometry(28, 1.25), materials.grassBand);
        stripe.rotation.x = -Math.PI / 2;
        stripe.position.set(0, -1.195, i * 3.1);
        scene.add(stripe);
    }

    const y = -1.17;
    const width = 13.8;
    const deadBall = 10.5;
    const goal = 8.7;
    const twentyTwo = 4.8;
    const five = 6.6;

    const mainLines = [
        [[-width / 2, y, -deadBall], [width / 2, y, -deadBall]],
        [[-width / 2, y, deadBall], [width / 2, y, deadBall]],
        [[-width / 2, y, -goal], [width / 2, y, -goal]],
        [[-width / 2, y, goal], [width / 2, y, goal]],
        [[-width / 2, y, -twentyTwo], [width / 2, y, -twentyTwo]],
        [[-width / 2, y, twentyTwo], [width / 2, y, twentyTwo]],
        [[-width / 2, y, 0], [width / 2, y, 0]],
        [[-width / 2, y, -deadBall], [-width / 2, y, deadBall]],
        [[width / 2, y, -deadBall], [width / 2, y, deadBall]],
    ];

    mainLines.forEach((line) => addLine(scene, line, materials.fieldLine, disposables));
    addLine(scene, [[-width / 2, y + 0.01, 0], [width / 2, y + 0.01, 0]], materials.fieldLineGold, disposables);

    [-five, five].forEach((x) => {
        for (let z = -goal; z <= goal; z += 1.6) {
            addLine(scene, [[x, y + 0.01, z], [x, y + 0.01, z + 0.6]], materials.fieldLine, disposables);
        }
    });

    [-3.6, 3.6].forEach((x) => {
        for (let z = -twentyTwo; z <= twentyTwo; z += 1.5) {
            addLine(scene, [[x, y + 0.012, z], [x, y + 0.012, z + 0.42]], materials.fieldLineGold, disposables);
        }
    });
}

function addLine(scene, points, material, disposables) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    disposables.push(geometry);
    scene.add(new THREE.Line(geometry, material));
}

// ═══════════════════════════════════════════════════════
//                    POTEAUX DE RUGBY
// ═══════════════════════════════════════════════════════

function createRugbyPosts(scene, materials) {
    const posts = new THREE.Group();
    const left = createPostPart(new THREE.CylinderGeometry(0.035, 0.035, 4.2, 10), materials.post);
    const right = createPostPart(new THREE.CylinderGeometry(0.035, 0.035, 4.2, 10), materials.post);
    const crossbar = createPostPart(new THREE.CylinderGeometry(0.028, 0.028, 1.7, 10), materials.post);

    left.position.set(-0.85, 1.0, 0);
    right.position.set(0.85, 1.0, 0);
    crossbar.position.set(0, 0.62, 0);
    crossbar.rotation.z = Math.PI / 2;

    posts.add(left, right, crossbar);
    posts.position.set(0, -1.15, -8.65);
    posts.scale.set(1.15, 1.15, 1.15);
    scene.add(posts);

    const shadow = new THREE.Mesh(
        new THREE.PlaneGeometry(3.2, 0.16),
        new THREE.MeshBasicMaterial({ color: 0xdbeeff, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(0, -1.145, -8.45);
    scene.add(shadow);
}

function createPostPart(geometry, material) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = false;
    return mesh;
}

// ═══════════════════════════════════════════════════════
//                    COACH LOW-POLY
// ═══════════════════════════════════════════════════════

function createCoach(scene, materials, animated) {
    const coach = new THREE.Group();

    const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.24), materials.shoe);
    leftFoot.position.set(-0.12, 0.02, 0.05);
    const rightFoot = leftFoot.clone();
    rightFoot.position.set(0.12, 0.02, 0.03);
    coach.add(leftFoot, rightFoot);

    const leftLeg = createLimb(new THREE.CylinderGeometry(0.07, 0.085, 0.43, 8), materials.pants, -0.11, 0.25, 0);
    const rightLeg = createLimb(new THREE.CylinderGeometry(0.07, 0.085, 0.43, 8), materials.pants, 0.11, 0.25, 0);
    coach.add(leftLeg, rightLeg);

    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.55, 0.24), materials.shirt);
    torso.position.set(0, 0.72, 0);
    torso.rotation.y = -0.18;
    torso.castShadow = !lowPowerMode;
    coach.add(torso);

    const leftArm = createLimb(new THREE.CylinderGeometry(0.045, 0.058, 0.42, 7), materials.jacket, -0.32, 0.78, 0.03);
    leftArm.rotation.z = 0.45;
    leftArm.rotation.x = -0.32;
    coach.add(leftArm);

    const rightArm = createLimb(new THREE.CylinderGeometry(0.045, 0.058, 0.54, 7), materials.jacket, 0.34, 0.84, 0.02);
    rightArm.rotation.z = -1.12;
    rightArm.rotation.x = -0.48;
    rightArm.rotation.y = -0.28;
    coach.add(rightArm);
    animated.coachArm = rightArm;

    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), materials.skin);
    leftHand.position.set(-0.38, 0.55, 0.1);
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), materials.skin);
    rightHand.position.set(0.62, 0.98, -0.12);
    coach.add(leftHand, rightHand);
    animated.coachHand = rightHand;

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.1, 8), materials.skin);
    neck.position.set(0, 1.04, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 10, 10), materials.skin);
    head.position.set(0, 1.18, 0);
    head.castShadow = !lowPowerMode;
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.148, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), materials.hair);
    hair.position.set(0, 1.205, 0);
    hair.scale.set(1, 0.52, 1);
    coach.add(neck, head, hair);

    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), materials.ball);
    ball.scale.set(1.55, 0.78, 0.78);
    ball.rotation.set(0.25, 0.35, -0.4);
    ball.position.set(-0.55, 0.18, 0.45);
    ball.castShadow = !lowPowerMode;
    coach.add(ball);
    animated.ball = ball;

    const ballLineMat = new THREE.LineBasicMaterial({ color: 0xf1d4ae, transparent: true, opacity: 0.55 });
    const seam = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-0.2, 0.19, 0.45),
            new THREE.Vector3(-0.55, 0.2, 0.45),
            new THREE.Vector3(-0.9, 0.19, 0.45),
        ]),
        ballLineMat
    );
    coach.add(seam);

    coach.position.set(0.3, -1.17, -1.85);
    coach.scale.set(1.18, 1.18, 1.18);
    coach.rotation.y = -0.2;
    scene.add(coach);
}

function createLimb(geometry, material, x, y, z) {
    const limb = new THREE.Mesh(geometry, material);
    limb.position.set(x, y, z);
    limb.castShadow = !lowPowerMode;
    return limb;
}

// ═══════════════════════════════════════════════════════
//                    SPHÈRES PEC
// ═══════════════════════════════════════════════════════

function createBrandOrbs(scene, materials, animated) {
    const positions = [
        { radius: 0.18, x: -0.82, y: 1.42, z: -1.55, phase: 0 },
        { radius: 0.12, x: -0.42, y: 1.7, z: -1.18, phase: 1.7 },
        { radius: 0.09, x: 0.02, y: 1.52, z: -1.42, phase: 3.1 },
    ];

    positions.forEach((data) => {
        const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(data.radius, 1), materials.gold);
        orb.position.set(data.x, data.y, data.z);
        orb.userData = { base: orb.position.clone(), phase: data.phase };
        scene.add(orb);
        animated.brandOrbs.push(orb);
    });

    const glow = new THREE.PointLight(0xE8A33D, 0.9, 4);
    glow.position.set(-0.5, 1.55, -1.45);
    scene.add(glow);
}

// ═══════════════════════════════════════════════════════
//                    BRUME ET PARTICULES
// ═══════════════════════════════════════════════════════

function createAtmosphere(scene, materials, animated, disposables) {
    const dustCount = lowPowerMode ? 120 : 280;
    const positions = new Float32Array(dustCount * 3);
    const velocities = [];

    for (let i = 0; i < dustCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 13;
        positions[i * 3 + 1] = -0.8 + Math.random() * 5.2;
        positions[i * 3 + 2] = -8 + Math.random() * 13;
        velocities.push({
            x: (Math.random() - 0.5) * 0.018,
            y: 0.012 + Math.random() * 0.014,
            z: (Math.random() - 0.5) * 0.012,
        });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    disposables.push(geometry);

    const dust = new THREE.Points(geometry, materials.dust);
    scene.add(dust);

    animated.particles = dust;
    animated.particleVelocities = velocities;
    animated.dustCount = dustCount;
}

// ═══════════════════════════════════════════════════════
//                    ANIMATIONS
// ═══════════════════════════════════════════════════════

function animateCoach(animated, elapsed) {
    if (animated.coachArm) {
        animated.coachArm.rotation.z = -1.12 + Math.sin(elapsed * 1.35) * 0.035;
        animated.coachArm.rotation.x = -0.48 + Math.sin(elapsed * 1.1) * 0.025;
    }
    if (animated.coachHand) {
        animated.coachHand.position.y = 0.98 + Math.sin(elapsed * 1.35) * 0.018;
    }
    if (animated.ball) {
        animated.ball.rotation.y += 0.004;
    }
}

function animateBrandOrbs(animated, elapsed) {
    animated.brandOrbs.forEach((orb, index) => {
        const phase = orb.userData.phase;
        orb.position.y = orb.userData.base.y + Math.sin(elapsed * 0.9 + phase) * 0.07;
        orb.position.x = orb.userData.base.x + Math.cos(elapsed * 0.55 + phase) * 0.035;
        orb.rotation.x += 0.006 + index * 0.001;
        orb.rotation.y += 0.01;
    });

    animated.halos.forEach((halo, index) => {
        const pulse = 1 + Math.sin(elapsed * 1.4 + index) * 0.05;
        halo.scale.setScalar(pulse);
    });
}

function animateAtmosphere(animated, elapsed, delta) {
    if (!animated.particles || prefersReducedMotion) return;

    const positions = animated.particles.geometry.attributes.position.array;
    for (let i = 0; i < animated.dustCount; i++) {
        const velocity = animated.particleVelocities[i];
        positions[i * 3] += velocity.x * delta;
        positions[i * 3 + 1] += velocity.y * delta;
        positions[i * 3 + 2] += velocity.z * delta;

        if (positions[i * 3 + 1] > 4.6) {
            positions[i * 3] = (Math.random() - 0.5) * 13;
            positions[i * 3 + 1] = -0.9;
            positions[i * 3 + 2] = -8 + Math.random() * 13;
        }
    }

    animated.particles.rotation.y = Math.sin(elapsed * 0.08) * 0.03;
    animated.particles.geometry.attributes.position.needsUpdate = true;
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}
