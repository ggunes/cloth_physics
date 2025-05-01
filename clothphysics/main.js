// Basic variables
let scene, camera, renderer, controls;
let cloth, ball;
let raycaster, mouse;
let selectedParticle = -1;
let clock = new THREE.Clock();

// Initialize scene
init();
animate();

function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('container').appendChild(renderer.domElement);
    
    // Camera controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Create cloth
    cloth = new Cloth(10, 10, 20, 0.9, 0.03, 1);
    cloth.mesh.castShadow = true;
    cloth.mesh.receiveShadow = true;
    scene.add(cloth.mesh);
    
    // Create ball
    const ballGeometry = new THREE.SphereGeometry(1, 32, 32);
    const ballMaterial = new THREE.MeshPhongMaterial({ color: 0x0077ff });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, 3, 3);
    ball.castShadow = true;
    ball.receiveShadow = true;
    scene.add(ball);
    
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x999999, 
        side: THREE.DoubleSide 
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = Math.PI / 2;
    floor.position.y = -2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Create wall (where the cloth is hanging)
    const wallGeometry = new THREE.BoxGeometry(12, 12, 0.5);
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x887766 });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.z = -1;
    wall.position.y = 4;
    wall.receiveShadow = true;
    scene.add(wall);
    
    // Raycaster for mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseDown(event) {
    event.preventDefault();
    
    // Normalize mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Update raycaster
    raycaster.setFromCamera(mouse, camera);
    
    // Check intersection with cloth mesh
    const intersects = raycaster.intersectObject(cloth.mesh);
    
    if (intersects.length > 0) {
        // Find closest intersection point
        const intersection = intersects[0];
        
        // Find particle closest to intersection point
        let minDistance = Infinity;
        let closestParticle = -1;
        
        for (let i = 0; i < cloth.particles.length; i++) {
            const particle = cloth.particles[i];
            const distance = particle.position.distanceTo(intersection.point);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestParticle = i;
            }
        }
        
        // Select particle
        if (minDistance < 1.0) {
            selectedParticle = closestParticle;
            controls.enabled = false;
        }
    }
}

function onMouseMove(event) {
    if (selectedParticle >= 0) {
        // Normalize mouse coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update raycaster
        raycaster.setFromCamera(mouse, camera);
        
        // Find intersection point with cloth plane
        const planeNormal = new THREE.Vector3(0, 0, 1);
        const planeConstant = 0; // z = 0 plane
        const plane = new THREE.Plane(planeNormal, planeConstant);
        const targetPosition = new THREE.Vector3();
        
        raycaster.ray.intersectPlane(plane, targetPosition);
        
        // Move selected particle
        cloth.moveParticle(selectedParticle, targetPosition);
    }
}

function onMouseUp() {
    selectedParticle = -1;
    controls.enabled = true;
}

function onKeyDown(event) {
    // Space key for wind effect
    if (event.keyCode === 32) { // Space key
        const windForce = new THREE.Vector3(
            Math.random() * 10 - 5,
            0,
            Math.random() * 10 - 5
        );
        cloth.applyWind(windForce);
        
        // Stop wind after 1 second
        setTimeout(() => {
            cloth.applyWind(new THREE.Vector3(0, 0, 0));
        }, 1000);
    }
    
    // R key to reset
    if (event.keyCode === 82) { // R key
        cloth.reset();
    }
}

function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    
    // Topu hareket ettir (basit dairesel hareket)
    const time = Date.now() * 0.001;
    ball.position.x = Math.sin(time) * 3;
    ball.position.z = Math.cos(time) * 3;
    ball.position.y = 3 + Math.sin(time * 2) * 0.5;
    
    // Kumaşı güncelle
    cloth.update(deltaTime);
    
    // Çarpışma kontrolü
    cloth.checkCollision(ball);
    
    // Kontrolleri güncelle
    controls.update();
    
    // Sahneyi render et
    renderer.render(scene, camera);
}