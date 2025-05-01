class Cloth {
    constructor(width, height, segments, stiffness, damping, mass) {
        this.width = width;
        this.height = height;
        this.segmentsX = segments;
        this.segmentsY = segments;
        this.stiffness = stiffness || 0.9;
        this.damping = damping || 0.03;
        this.mass = mass || 1;
        this.gravity = new THREE.Vector3(0, -9.8, 0);
        this.wind = new THREE.Vector3(0, 0, 0);
        
        this.particles = [];
        this.springs = [];
        
        this.createParticles();
        this.createSprings();
        
        // Create cloth mesh
        this.geometry = new THREE.ParametricBufferGeometry(
            (u, v, target) => {
                const x = u * this.width - this.width / 2;
                const y = this.height - v * this.height;
                const z = 0;
                target.set(x, y, z);
            },
            this.segmentsX, this.segmentsY
        );
        
        // Red, slightly shiny material
        this.material = new THREE.MeshPhongMaterial({
            color: 0xcc0000,
            side: THREE.DoubleSide,
            specular: 0x222222,
            shininess: 30,
            flatShading: false
        });
        
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }
    
    createParticles() {
        // Create particles
        for (let y = 0; y <= this.segmentsY; y++) {
            for (let x = 0; x <= this.segmentsX; x++) {
                const u = x / this.segmentsX;
                const v = y / this.segmentsY;
                
                const posX = u * this.width - this.width / 2;
                const posY = this.height - v * this.height;
                const posZ = 0;
                
                const particle = {
                    position: new THREE.Vector3(posX, posY, posZ),
                    previousPosition: new THREE.Vector3(posX, posY, posZ),
                    originalPosition: new THREE.Vector3(posX, posY, posZ),
                    velocity: new THREE.Vector3(0, 0, 0),
                    acceleration: new THREE.Vector3(0, 0, 0),
                    mass: this.mass,
                    fixed: y === 0, // Fix particles in the top row
                    index: this.particles.length
                };
                
                this.particles.push(particle);
            }
        }
    }
    
    createSprings() {
        // Horizontal springs
        for (let y = 0; y <= this.segmentsY; y++) {
            for (let x = 0; x < this.segmentsX; x++) {
                const p1 = y * (this.segmentsX + 1) + x;
                const p2 = p1 + 1;
                
                this.springs.push({
                    p1: p1,
                    p2: p2,
                    restLength: this.particles[p1].position.distanceTo(this.particles[p2].position),
                    stiffness: this.stiffness
                });
            }
        }
        
        // Vertical springs
        for (let y = 0; y < this.segmentsY; y++) {
            for (let x = 0; x <= this.segmentsX; x++) {
                const p1 = y * (this.segmentsX + 1) + x;
                const p2 = p1 + this.segmentsX + 1;
                
                this.springs.push({
                    p1: p1,
                    p2: p2,
                    restLength: this.particles[p1].position.distanceTo(this.particles[p2].position),
                    stiffness: this.stiffness
                });
            }
        }
        
        // Diagonal springs
        for (let y = 0; y < this.segmentsY; y++) {
            for (let x = 0; x < this.segmentsX; x++) {
                const p1 = y * (this.segmentsX + 1) + x;
                const p2 = p1 + this.segmentsX + 2;
                
                this.springs.push({
                    p1: p1,
                    p2: p2,
                    restLength: this.particles[p1].position.distanceTo(this.particles[p2].position),
                    stiffness: this.stiffness * 0.5
                });
                
                const p3 = y * (this.segmentsX + 1) + x + 1;
                const p4 = p3 + this.segmentsX;
                
                this.springs.push({
                    p1: p3,
                    p2: p4,
                    restLength: this.particles[p3].position.distanceTo(this.particles[p4].position),
                    stiffness: this.stiffness * 0.5
                });
            }
        }
    }
    
    update(deltaTime) {
        // Physics calculations
        this.integrateForces(deltaTime);
        this.satisfyConstraints();
        this.updateGeometry();
    }
    
    integrateForces(deltaTime) {
        const dt = Math.min(deltaTime, 0.02); // Limit maximum time step
        
        // Apply forces to each particle
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            
            if (particle.fixed) continue;
            
            // Apply gravity and wind forces
            particle.acceleration.copy(this.gravity);
            particle.acceleration.add(this.wind);
            
            // Verlet integration
            const temp = particle.position.clone();
            
            // Update position
            particle.position.add(
                particle.position.clone()
                    .sub(particle.previousPosition)
                    .multiplyScalar(1.0 - this.damping)
            );
            
            particle.position.add(
                particle.acceleration.clone().multiplyScalar(dt * dt)
            );
            
            // Save previous position
            particle.previousPosition.copy(temp);
        }
    }
    
    satisfyConstraints() {
        // Apply spring constraints
        for (let i = 0; i < this.springs.length; i++) {
            const spring = this.springs[i];
            const p1 = this.particles[spring.p1];
            const p2 = this.particles[spring.p2];
            
            const diff = p1.position.clone().sub(p2.position);
            const currentLength = diff.length();
            
            if (currentLength === 0) continue;
            
            const correction = diff.multiplyScalar(1 - spring.restLength / currentLength);
            const correctionHalf = correction.clone().multiplyScalar(0.5);
            
            if (!p1.fixed) {
                p1.position.sub(correctionHalf.clone().multiplyScalar(spring.stiffness));
            }
            
            if (!p2.fixed) {
                p2.position.add(correctionHalf.clone().multiplyScalar(spring.stiffness));
            }
        }
    }
    
    updateGeometry() {
        // Update mesh geometry
        const positions = this.geometry.attributes.position.array;
        
        for (let i = 0, j = 0; i < this.particles.length; i++, j += 3) {
            const particle = this.particles[i];
            positions[j] = particle.position.x;
            positions[j + 1] = particle.position.y;
            positions[j + 2] = particle.position.z;
        }
        
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }
    
    applyWind(force) {
        this.wind.copy(force);
    }
    
    checkCollision(sphere) {
        const spherePosition = sphere.position;
        const sphereRadius = sphere.geometry.parameters.radius;
        
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            
            if (particle.fixed) continue;
            
            const distance = particle.position.distanceTo(spherePosition);
            
            if (distance < sphereRadius) {
                // Collision detected
                const normal = particle.position.clone().sub(spherePosition).normalize();
                particle.position.copy(
                    spherePosition.clone().add(normal.multiplyScalar(sphereRadius))
                );
                
                // Collision response
                const velocityAlongNormal = particle.velocity.dot(normal);
                if (velocityAlongNormal < 0) {
                    particle.velocity.sub(normal.multiplyScalar(velocityAlongNormal * 1.5));
                }
            }
        }
    }
    
    moveParticle(index, newPosition) {
        if (index >= 0 && index < this.particles.length) {
            const particle = this.particles[index];
            if (!particle.fixed) {
                particle.position.copy(newPosition);
            }
        }
    }
    
    reset() {
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            particle.position.copy(particle.originalPosition);
            particle.previousPosition.copy(particle.originalPosition);
            particle.velocity.set(0, 0, 0);
        }
        this.updateGeometry();
    }
}