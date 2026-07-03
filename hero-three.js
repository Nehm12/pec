// ─── IMPORTATION THREE.JS ───────────────────────────
// Charge le moteur 3D depuis le CDN via importmap (défini dans index.html)
import * as THREE from 'three';

// ─── SCÈNE (le monde 3D) ────────────────────────────
// Contient tous les objets, lumières, et la caméra
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a); // fond gris très foncé

// ─── CAMÉRA ──────────────────────────────────────────
// Perspective: 42° de champ de vision, ratio écran, clipping proche/loin
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 50);
camera.position.set(7, 5, 9); // position initiale : derrière-droite, en hauteur
camera.lookAt(0, 0, 0);

// ─── RENDU (WebGL) ───────────────────────────────────
// Affiche la scène 3D dans un canvas HTML
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; // rendu cinématographique
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; // active les ombres
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // ombres douces

// ─── INTÉGRATION DU CANVAS DANS LE HERO ─────────────
// Le canvas 3D est placé en arrière-plan du hero, derrière le contenu texte
const canvas = renderer.domElement;
canvas.style.position = 'absolute';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
canvas.style.pointerEvents = 'none'; // les clics traversent vers les boutons

const hero = document.querySelector('.hero');
hero.style.position = 'relative';
hero.insertBefore(canvas, hero.firstChild);

// ═══════════════════════════════════════════════════════
//                    MATÉRIAUX
// ═══════════════════════════════════════════════════════

// Sol de la salle de formation
const floorMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    roughness: 0.8,
    metalness: 0.1,
});

// Murs de la salle (visibles des deux côtés)
const wallMat = new THREE.MeshStandardMaterial({
    color: 0x141414,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
});

// Scène (estrade)
const stageMat = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.5,
    metalness: 0.3,
});

// Siège des étudiants
const seatMat = new THREE.MeshStandardMaterial({
    color: 0x1e1e1e,
    roughness: 0.7,
    metalness: 0.0,
});

// Peau des personnages
const skinMat = new THREE.MeshStandardMaterial({
    color: 0x3a322a,
    roughness: 0.7,
    metalness: 0.0,
});

// Vêtements des personnages
const clothMat = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.8,
    metalness: 0.0,
});

// Écran de présentation (effet éteint/allumé avec émission)
const screenMat = new THREE.MeshStandardMaterial({
    color: 0x0f1a22,
    roughness: 0.2,
    metalness: 0.8,
    emissive: 0x0a1a2a,
    emissiveIntensity: 0.2,
});

// Orange (planètes du logo PEC)
const goldMat = new THREE.MeshStandardMaterial({
    color: 0xE8A33D,
    roughness: 0.15,
    metalness: 0.9,
    emissive: 0xE8A33D,
    emissiveIntensity: 0.1,
});

// ═══════════════════════════════════════════════════════
//                    LUMIÈRES
// ═══════════════════════════════════════════════════════

// Lumière ambiante faible — évite les zones complètement noires
const ambient = new THREE.AmbientLight(0x222244, 0.2);
scene.add(ambient);

// Lumière zénithale (plafond)
const ceiling = new THREE.DirectionalLight(0xffeedd, 0.6);
ceiling.position.set(0, 8, 0);
scene.add(ceiling);

// Projecteur principal (spot chaud) — éclaire le formateur
const spot1 = new THREE.SpotLight(0xffe4c4, 12, 18, Math.PI / 7, 0.3, 1.2);
spot1.position.set(2, 7, -1);
spot1.target.position.set(0, -0.3, 0.5);
scene.add(spot1);
scene.add(spot1.target);

// Projecteur secondaire (spot froid) — éclairage de la salle
const spot2 = new THREE.SpotLight(0x4488ff, 3, 20, Math.PI / 6, 0.4, 1);
spot2.position.set(-4, 6, -3);
spot2.target.position.set(-1, 0, 2);
scene.add(spot2);
scene.add(spot2.target);

// Remplissage avant
const fill = new THREE.DirectionalLight(0x88bbff, 0.3);
fill.position.set(-2, 3, -5);
scene.add(fill);

// Contre-jour (rim light)
const rim = new THREE.DirectionalLight(0xffeedd, 0.5);
rim.position.set(3, 4, -6);
scene.add(rim);

// ═══════════════════════════════════════════════════════
//                    SALLE DE FORMATION
// ═══════════════════════════════════════════════════════

// Sol — large plan horizontal
const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 14), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, -1.2, 1);
floor.receiveShadow = true;
scene.add(floor);

// Grille au sol — lignes de carrelage pour l'effet salle de formation
const lineMat = new THREE.LineBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.3 });
for (let i = -7; i <= 7; i += 1.2) {
    const pts1 = [new THREE.Vector3(i, -1.18, -5), new THREE.Vector3(i, -1.18, 7)];
    const g1 = new THREE.BufferGeometry().setFromPoints(pts1);
    scene.add(new THREE.Line(g1, lineMat));
}
for (let j = -5; j <= 7; j += 1.2) {
    const pts2 = [new THREE.Vector3(-7, -1.18, j), new THREE.Vector3(7, -1.18, j)];
    const g2 = new THREE.BufferGeometry().setFromPoints(pts2);
    scene.add(new THREE.Line(g2, lineMat));
}

// Mur du fond (derrière le formateur)
const backWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 5), wallMat);
backWall.position.set(0, 1.3, -5);
scene.add(backWall);

// Mur gauche
const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), wallMat);
leftWall.position.set(-8, 1.3, 1);
leftWall.rotation.y = Math.PI / 2;
scene.add(leftWall);

// Mur droit
const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 5), wallMat);
rightWall.position.set(8, 1.3, 1);
rightWall.rotation.y = -Math.PI / 2;
scene.add(rightWall);

// ═══════════════════════════════════════════════════════
//                    ESTRADE (SCÈNE)
// ═══════════════════════════════════════════════════════

// Plateforme surélevée où se tient le formateur
const stage = new THREE.Mesh(new THREE.BoxGeometry(5, 0.2, 2.5), stageMat);
stage.position.set(0, -1.1, -3.5);
stage.receiveShadow = true;
stage.castShadow = true;
scene.add(stage);

// Façade de l'estrade (bandeau avant)
const stageFront = new THREE.Mesh(new THREE.BoxGeometry(5, 0.3, 0.1), stageMat);
stageFront.position.set(0, -1.0, -2.25);
scene.add(stageFront);

// ═══════════════════════════════════════════════════════
//                    FORMATEUR (FIGURE HUMAINE)
// ═══════════════════════════════════════════════════════

const coach = new THREE.Group();

// Chaussures
const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
const lFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.2), shoeMat);
lFoot.position.set(-0.1, -0.02, 0.05);
coach.add(lFoot);
const rFoot = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.2), shoeMat);
rFoot.position.set(0.1, -0.02, 0.05);
coach.add(rFoot);

// Jambes (pantalon)
const pantMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });
const lLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.35, 8), pantMat);
lLeg.position.set(-0.1, 0.15, 0);
lLeg.castShadow = true;
coach.add(lLeg);
const rLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.35, 8), pantMat);
rLeg.position.set(0.1, 0.15, 0);
rLeg.castShadow = true;
coach.add(rLeg);

// Torse (chemise)
const shirtMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7, metalness: 0.1 });
const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.22), shirtMat);
torso.position.set(0, 0.5, 0);
torso.castShadow = true;
coach.add(torso);

// Bras
const jacketMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.2 });
const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.35, 6), jacketMat);
lArm.position.set(-0.28, 0.6, 0);
lArm.rotation.z = 0.2; // léger angle pour posture naturelle
lArm.castShadow = true;
coach.add(lArm);

const rArm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.4, 6), jacketMat);
rArm.position.set(0.28, 0.6, 0.05);
rArm.rotation.z = -0.3;
rArm.rotation.x = -0.9; // bras pointant vers l'écran
rArm.castShadow = true;
coach.add(rArm);

// Mains
const handMat = new THREE.MeshStandardMaterial({ color: 0x3a322a, roughness: 0.7 });
const lHand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), handMat);
lHand.position.set(-0.33, 0.45, 0.05);
coach.add(lHand);
const rHand = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), handMat);
rHand.position.set(0.33, 0.35, 0.2);
coach.add(rHand);

// Cou
const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.08, 8), skinMat);
neck.position.set(0, 0.78, 0);
coach.add(neck);

// Tête
const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 10), skinMat);
head.position.set(0, 0.9, 0);
head.castShadow = true;
coach.add(head);

// Cheveux (demi-sphère sur le dessus de la tête)
const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
const hair = new THREE.Mesh(new THREE.SphereGeometry(0.145, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
hair.position.set(0, 0.92, 0);
hair.scale.set(1, 0.5, 1);
coach.add(hair);

// Positionnement du formateur sur l'estrade
coach.position.set(0, -1.0, -3.6);
coach.scale.set(1.1, 1.1, 1.1);
scene.add(coach);

// ═══════════════════════════════════════════════════════
//                    PUPITRE
// ═══════════════════════════════════════════════════════

// Petit podium vitré à côté du formateur
const podiumMat2 = new THREE.MeshStandardMaterial({
    color: 0x1a2a33,
    roughness: 0.1,
    metalness: 0.8,
    transparent: true,
    opacity: 0.3,
});
const podium2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), podiumMat2);
podium2.position.set(0.4, -1.0, -3.2);
scene.add(podium2);

// ═══════════════════════════════════════════════════════
//                    ÉCRAN DE PRÉSENTATION
// ═══════════════════════════════════════════════════════

const screenGroup = new THREE.Group();

// Surface de l'écran
const scr = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.8, 0.05), screenMat);
scr.position.z = 0;
screenGroup.add(scr);

// Bordure lumineuse orange autour de l'écran
const borderMat = new THREE.LineBasicMaterial({ color: 0xE8A33D, transparent: true, opacity: 0.12 });
const borderG = new THREE.EdgesGeometry(new THREE.BoxGeometry(2.8, 1.8, 0.05));
const borderL = new THREE.LineSegments(borderG, borderMat);
screenGroup.add(borderL);

// Barres de données animées (couleur turquoise)
const barM = new THREE.MeshStandardMaterial({
    color: 0x2A8A8F,
    emissive: 0x2A8A8F,
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.4,
});
const bars = [];
for (let i = 0; i < 8; i++) {
    const bh = 0.2 + Math.random() * 0.8; // hauteur aléatoire initiale
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.18, bh, 0.02), barM);
    bar.position.set(-1.1 + i * 0.32, -0.5 + bh / 2, 0.04);
    bar.userData = { baseH: bh, phase: i * 0.7, speed: 0.3 + Math.random() * 0.3 };
    screenGroup.add(bar);
    bars.push(bar);
}

// Points de données (turquoise clair)
const dotM = new THREE.PointsMaterial({ color: 0x7FC4C8, size: 0.025, transparent: true, opacity: 0.2 });
const dotP = [];
for (let i = 0; i < 40; i++) {
    dotP.push((Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 1.5, 0.04);
}
const dG = new THREE.BufferGeometry();
dG.setAttribute('position', new THREE.Float32BufferAttribute(dotP, 3));
const dM = new THREE.Points(dG, dotM);
screenGroup.add(dM);

// Courbe de tendance sur l'écran
const curvePoints = [];
for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const x = -1 + t * 2;
    const y = -0.5 + Math.sin(t * Math.PI * 3) * 0.4 + t * 0.5; // courbe sinusoïdale croissante
    curvePoints.push(new THREE.Vector3(x, y, 0.04));
}
const curveG = new THREE.BufferGeometry().setFromPoints(curvePoints);
const curveL = new THREE.Line(curveG, new THREE.LineBasicMaterial({ color: 0x2A8A8F, transparent: true, opacity: 0.15 }));
screenGroup.add(curveL);

// Position de l'écran au fond de la scène, au-dessus de l'estrade
screenGroup.position.set(0, 0.6, -4.6);
scene.add(screenGroup);

// ═══════════════════════════════════════════════════════
//                    ÉTUDIANTS (5 RANGÉES)
// ═══════════════════════════════════════════════════════

// Crée un étudiant (corps + tête + cheveux + épaules) positionné en (x, z)
function makeStudent(x, z) {
    const g = new THREE.Group();

    // Corps
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.16), clothMat);
    body.position.y = 0.15;
    body.castShadow = true;
    g.add(body);

    // Tête
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), skinMat);
    head.position.y = 0.38;
    g.add(head);

    // Cheveux
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.092, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
    hair.position.y = 0.39;
    hair.scale.set(1, 0.5, 1);
    g.add(hair);

    // Épaules
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.04, 0.1), clothMat);
    shoulder.position.y = 0.32;
    g.add(shoulder);

    g.position.set(x, -1.05, z);
    g.lookAt(0, -0.5, -3); // tous les étudiants regardent vers le formateur
    return g;
}

// Configuration des rangées : plus on s'éloigne, plus il y a d'étudiants
const rowConfigs = [
    { z: -0.5, count: 7, spread: 3.0 },   // 1ère rangée (7 pers.)
    { z: 0.5, count: 9, spread: 4.0 },    // 2e rangée (9 pers.)
    { z: 1.5, count: 11, spread: 4.8 },   // 3e rangée (11 pers.)
    { z: 2.5, count: 13, spread: 5.4 },   // 4e rangée (13 pers.)
    { z: 3.5, count: 15, spread: 6.0 },   // 5e rangée (15 pers.)
];

// Génération de tous les étudiants
rowConfigs.forEach(row => {
    for (let i = 0; i < row.count; i++) {
        const x = -row.spread / 2 + (i / (row.count - 1)) * row.spread;
        const student = makeStudent(x, row.z);
        scene.add(student);
    }
});

// ═══════════════════════════════════════════════════════
//               NOYAU DE CONNAISSANCE (FLOTTANT)
// ═══════════════════════════════════════════════════════

// Sphère icosaèdrique dorée au-dessus du formateur
const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 1), goldMat);
core.position.set(0, 1.8, -3.0);
scene.add(core);

// Lueur orange autour du noyau
const coreGlow = new THREE.PointLight(0xE8A33D, 0.8, 4);
coreGlow.position.copy(core.position);
scene.add(coreGlow);

// ═══════════════════════════════════════════════════════
//               ANNEAUX ORBITAUX
// ═══════════════════════════════════════════════════════

// Premier anneau (horizontal) — orange
const ringMat = new THREE.MeshStandardMaterial({
    color: 0xE8A33D,
    transparent: true,
    opacity: 0.06,
    roughness: 0.3,
    metalness: 0.8,
});
const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.008, 6, 40), ringMat);
ring.position.copy(core.position);
scene.add(ring);

// Second anneau (incliné)
const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.006, 6, 40), ringMat);
ring2.position.copy(core.position);
ring2.rotation.x = 0.5;
ring2.rotation.z = 0.3;
scene.add(ring2);

// ═══════════════════════════════════════════════════════
//               LUMIÈRES DE PLAFOND
// ═══════════════════════════════════════════════════════

// Rangée de néons au plafond
const lightMat = new THREE.MeshStandardMaterial({
    color: 0xffeedd,
    emissive: 0xffeedd,
    emissiveIntensity: 0.05,
    transparent: true,
    opacity: 0.3,
});
for (let i = -3; i <= 3; i += 2) {
    const l = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.4), lightMat);
    l.position.set(i, 2.5, -1);
    l.rotation.x = -Math.PI / 2;
    scene.add(l);
}

// ═══════════════════════════════════════════════════════
//               PARTICULES AMBIANTES
// ═══════════════════════════════════════════════════════

// Petits points orange flottant dans la salle
const pCount = 400;
const pPos = new Float32Array(pCount * 3);
const pVel = [];
for (let i = 0; i < pCount; i++) {
    pPos[i * 3] = (Math.random() - 0.5) * 10;
    pPos[i * 3 + 1] = -1 + Math.random() * 4;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    pVel.push({ x: (Math.random() - 0.5) * 0.002, y: 0.003 + Math.random() * 0.005, z: (Math.random() - 0.5) * 0.002 });
}
const pG = new THREE.BufferGeometry();
pG.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
const pM = new THREE.PointsMaterial({
    color: 0xE8A33D, size: 0.015, transparent: true, opacity: 0.15,
    blending: THREE.AdditiveBlending, sizeAttenuation: true,
});
const particles = new THREE.Points(pG, pM);
scene.add(particles);

// ═══════════════════════════════════════════════════════
//               BOUCLE D'ANIMATION
// ═══════════════════════════════════════════════════════

let time = 0;

function animate() {
    requestAnimationFrame(animate);
    time += 0.01;

    // ── Caméra orbitale ──
    // La caméra tourne lentement autour de la salle (rayon 10, vitesse 0.04)
    const cr = 10;
    const cs = 0.04;
    const cx = Math.cos(time * cs) * cr;
    const cz = Math.sin(time * cs) * cr;
    camera.position.lerp(new THREE.Vector3(cx, 3.5 + Math.sin(time * 0.15) * 0.3, cz), 0.012);
    camera.lookAt(0, -0.2, -1); // regarde fixement vers l'estrade

    // ── Bras du formateur ──
    // Petit mouvement de pointé vers l'écran
    rArm.rotation.x = -0.9 + Math.sin(time * 1.5) * 0.06;

    // ── Noyau de connaissance ──
    // Rotation lente et pulsation lumineuse
    core.rotation.x += 0.005;
    core.rotation.y += 0.01;
    coreGlow.intensity = 0.5 + Math.sin(time * 2) * 0.3;

    // ── Anneaux ──
    // Rotation continue sur plusieurs axes
    ring.rotation.y += 0.008;
    ring.rotation.x += 0.003;
    ring2.rotation.y += 0.005;
    ring2.rotation.z += 0.004;

    // ── Barres de l'écran ──
    // Animation oscillante des hauteurs de barres (graphique dynamique)
    bars.forEach(bar => {
        const s = bar.userData.speed;
        const p = bar.userData.phase;
        bar.scale.y = 0.5 + Math.abs(Math.sin(time * s + p)) * 2.5;
    });

    // ── Particules ──
    // Mouvement ascendant lent ; recyclage en bas quand elles dépassent
    const pos = particles.geometry.attributes.position.array;
    for (let i = 0; i < pCount; i++) {
        pos[i * 3] += pVel[i].x;
        pos[i * 3 + 1] += pVel[i].y;
        pos[i * 3 + 2] += pVel[i].z;
        if (pos[i * 3 + 1] > 3) {
            pos[i * 3 + 1] = -1;
            pos[i * 3] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
        }
    }
    particles.geometry.attributes.position.needsUpdate = true;

    // ── Rendu final ──
    renderer.render(scene, camera);
}

// Démarrage de l'animation
animate();

// ─── ADAPTATION AU REDIMENSIONNEMENT ──────────────────
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
