// script.js
let scene, camera, renderer, linesMesh, nodesMesh;
let mouseX = 0, mouseY = 0;
const MAX_NODES = 300; // تعداد نقاط شبکه
const CONNECT_DISTANCE = 2.5; // حداکثر فاصله برای ایجاد خط اتصال

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x020617, 0.1); // ایجاد مه برای عمق

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 7;

    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x020617, 1);

    // ۱. ساخت موقعیت تصادفی نقاط
    const positions = new Float32Array(MAX_NODES * 3);
    const velocities = [];

    for (let i = 0; i < MAX_NODES; i++) {
        // پخش نقاط در یک مکعب بزرگ
        positions[i * 3] = (Math.random() - 0.5) * 15;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

        // سرعت حرکت آرام برای هر نقطه
        velocities.push({
            x: (Math.random() - 0.5) * 0.005,
            y: (Math.random() - 0.5) * 0.005,
            z: (Math.random() - 0.5) * 0.005
        });
    }

    // ۲. ساخت مش نقاط (Nodes)
    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const nodeMaterial = new THREE.PointsMaterial({
        color: 0x06b6d4, // رنگ نئون اصلی
        size: 0.08,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending // افکت درخشش
    });

    nodesMesh = new THREE.Points(nodeGeometry, nodeMaterial);
    scene.add(nodesMesh);

    // ۳. ساخت مش خطوط اتصال (Lines) - ساختار خالی، در اپدیت پر می‌شود
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x0891b2,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
    });

    linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);

    // ذخیره سرعت‌ها برای استفاده در انیمیشن
    nodesMesh.userData.velocities = velocities;

    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onWindowResize);
    animate();
}

function onMouseMove(event) {
    // محاسبه موقعیت موس نسبت به مرکز صفحه
    mouseX = (event.clientX - window.innerWidth / 2) / 150;
    mouseY = (event.clientY - window.innerHeight / 2) / 150;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateNetwork() {
    const positions = nodesMesh.geometry.attributes.position.array;
    const velocities = nodesMesh.userData.velocities;

    const linePositions = [];
    let lineCount = 0;

    // آپدیت موقعیت نقاط و محاسبه خطوط اتصال
    for (let i = 0; i < MAX_NODES; i++) {
        // حرکت نقاط
        positions[i * 3] += velocities[i].x;
        positions[i * 3 + 1] += velocities[i].y;
        positions[i * 3 + 2] += velocities[i].z;

        // برخورد با محدودیت‌های فضا (برگشت به داخل)
        if (Math.abs(positions[i * 3]) > 7.5) velocities[i].x *= -1;
        if (Math.abs(positions[i * 3 + 1]) > 5) velocities[i].y *= -1;
        if (Math.abs(positions[i * 3 + 2]) > 5) velocities[i].z *= -1;

        // بررسی فاصله با سایر نقاط برای کشیدن خط
        for (let j = i + 1; j < MAX_NODES; j++) {
            const dx = positions[i * 3] - positions[j * 3];
            const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
            const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < CONNECT_DISTANCE) {
                // اضافه کردن دو نقطه خط
                linePositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                linePositions.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
                lineCount++;
            }
        }
    }

    // آپدیت هندسه نقاط
    nodesMesh.geometry.attributes.position.needsUpdate = true;

    // آپدیت هندسه خطوط
    if (lineCount > 0) {
        linesMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        linesMesh.geometry.computeBoundingSphere();
        linesMesh.visible = true;
    } else {
        linesMesh.visible = false;
    }
}

function animate() {
    requestAnimationFrame(animate);

    // حرکت نرم دوربین بر اساس موس (Parallax)
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    updateNetwork();

    renderer.render(scene, camera);
}

init();