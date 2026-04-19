// Jabexen Global Background System
let scene, camera, renderer, linesMesh, nodesMesh;
let mouseX = 0, mouseY = 0;
const MAX_NODES = 300;
const CONNECT_DISTANCE = 2.5;

function init() {
    scene = new THREE.Scene();
    // ایجاد مه برای عمق‌دهی به شبکه در فواصل دور
    scene.fog = new THREE.FogExp2(0x020617, 0.1);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 7;

    const canvasElement = document.getElementById('bg-canvas');
    if (!canvasElement) return; // جلوگیری از خطا اگر کانواس در صفحه نباشد

    renderer = new THREE.WebGLRenderer({
        canvas: canvasElement,
        antialias: true,
        alpha: true // اجازه به نمایش پس‌زمینه CSS در صورت نیاز
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // بهینه‌سازی برای نمایشگرهای با تراکم پیکسلی بالا
    renderer.setClearColor(0x020617, 1);

    // ۱. ساخت موقعیت و سرعت تصادفی نقاط
    const positions = new Float32Array(MAX_NODES * 3);
    const velocities = [];

    for (let i = 0; i < MAX_NODES; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 15;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

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
        color: 0x06b6d4,
        size: 0.08,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    nodesMesh = new THREE.Points(nodeGeometry, nodeMaterial);
    scene.add(nodesMesh);

    // ۳. ساخت مش خطوط اتصال (Lines)
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x0891b2,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
    });

    linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);

    nodesMesh.userData.velocities = velocities;

    // ایونت‌ها
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onWindowResize);

    animate();
}

function onMouseMove(event) {
    mouseX = (event.clientX - window.innerWidth / 2) / 150;
    mouseY = (event.clientY - window.innerHeight / 2) / 150;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function updateNetwork() {
    const positions = nodesMesh.geometry.attributes.position.array;
    const velocities = nodesMesh.userData.velocities;
    const linePositions = [];
    let lineCount = 0;

    for (let i = 0; i < MAX_NODES; i++) {
        // حرکت نقاط
        positions[i * 3] += velocities[i].x;
        positions[i * 3 + 1] += velocities[i].y;
        positions[i * 3 + 2] += velocities[i].z;

        // برخورد با مرزهای مجازی (برگشت به داخل)
        if (Math.abs(positions[i * 3]) > 7.5) velocities[i].x *= -1;
        if (Math.abs(positions[i * 3 + 1]) > 5) velocities[i].y *= -1;
        if (Math.abs(positions[i * 3 + 2]) > 5) velocities[i].z *= -1;

        // محاسبه فواصل برای خطوط
        for (let j = i + 1; j < MAX_NODES; j++) {
            const dx = positions[i * 3] - positions[j * 3];
            const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
            const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < CONNECT_DISTANCE * CONNECT_DISTANCE) {
                linePositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                linePositions.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
                lineCount++;
            }
        }
    }

    nodesMesh.geometry.attributes.position.needsUpdate = true;

    if (lineCount > 0) {
        linesMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        linesMesh.visible = true;
    } else {
        linesMesh.visible = false;
    }
}

function animate() {
    requestAnimationFrame(animate);

    // حرکت پارالاکس دوربین
    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    updateNetwork();
    renderer.render(scene, camera);
}

// شروع اجرای اسکریپت
init();