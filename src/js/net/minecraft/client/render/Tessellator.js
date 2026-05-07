import * as THREE from "three";

export default class Tessellator {

    static timeUniform = { value: 0 };
    static wavingEnabledUniform = { value: 1.0 };
    static rainIntensityUniform = { value: 0.0 };
    static sunDirUniform = { value: new THREE.Vector3(0, 1, 0) };

    constructor() {
        this.material = new THREE.MeshBasicMaterial({
            side: THREE.FrontSide,
            transparent: false,
            depthTest: true,
            vertexColors: true,
            alphaTest: 0.5
        });

        this.material.onBeforeCompile = (shader) => {
            shader.uniforms.time = Tessellator.timeUniform;
            shader.uniforms.wavingEnabled = Tessellator.wavingEnabledUniform;
            shader.uniforms.rainIntensity = Tessellator.rainIntensityUniform;
            shader.uniforms.sunDir = Tessellator.sunDirUniform;

            shader.vertexShader = `
                uniform float time;
                uniform float wavingEnabled;
                attribute float waving;
                varying vec3 vWorldPosition;
                varying vec3 vNormalAttrib;
            ` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                vNormalAttrib = normal;
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                vec3 transformed = vec3( position );
                if (wavingEnabled > 0.5 && waving > 0.01) {
                    float wave = sin(time * 2.2 + position.x * 0.4 + position.z * 0.4) * 0.12 * waving;
                    transformed.x += wave;
                    transformed.z += wave;
                }
                `
            );

            shader.fragmentShader = `
                uniform float rainIntensity;
                uniform vec3 sunDir;
                varying vec3 vWorldPosition;
                varying vec3 vNormalAttrib;
            ` + shader.fragmentShader;


        };

        // Unified static cache key prevents Three.js from generating redundant shader programs 
        // during mass tessellation, which significantly reduces GPU driver stress.
        this.material.customProgramCacheKey = () => "waving_foliage_v3_optimized";

        this.red = 0;
        this.green = 0;
        this.blue = 0;
        this.alpha = 0;
    }

    bindTexture(texture) {
        if (this.material.map === texture) return;
        this.material.map = texture;
        this.material.needsUpdate = true;
    }

    /**
     * Configures this tessellator for enchanted glint rendering.
     * Uses a specialized ShaderMaterial for high reliability and UV matrix animation.
     */
    setupGlint(matrixUniform, texture) {
        this.isGlint = true;
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                map: { value: texture },
                glintMatrix: matrixUniform,
                alphaMap: { value: null },
                alphaTransform: { value: new THREE.Matrix3() },
                useAlpha: { value: false },
                brightness: { value: 1.0 },
                glintColor: { value: new THREE.Color(0.38, 0.19, 0.61) },
                glintAlpha: { value: 1.0 }
            },
            vertexShader: `
                uniform mat3 glintMatrix;
                uniform mat3 alphaTransform;
                varying vec2 vGlintUv;
                varying vec2 vAlphaUv;
                void main() {
                    // Item/Block face UVs (0..1)
                    vAlphaUv = (alphaTransform * vec3(uv, 1.0)).xy;
                    // Animated Glint UVs
                    vGlintUv = (glintMatrix * vec3(uv, 1.0)).xy;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform sampler2D map;
                uniform sampler2D alphaMap;
                uniform bool useAlpha;
                uniform float brightness;
                uniform vec3 glintColor;
                uniform float glintAlpha;
                varying vec2 vGlintUv;
                varying vec2 vAlphaUv;
                void main() {
                    vec4 glint = texture2D(map, vGlintUv);
                    // Enchantment Color Tint
                    vec3 color = glint.rgb * glintColor * brightness;
                    float alpha = glint.a * brightness * glintAlpha;
                    
                    // Optional masking for 2D item icons
                    if (useAlpha) {
                        alpha *= texture2D(alphaMap, vAlphaUv).a;
                    }
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthTest: true,
            depthWrite: false,
            side: THREE.DoubleSide,
            polygonOffset: true,
            polygonOffsetFactor: -1,
            polygonOffsetUnits: -4
        });
    }

    setTransparent(transparent) {
        if (this.isGlint) return;
        this.material.transparent = transparent;
        // Translucent objects should not write to depth buffer to avoid occlusion of items/entities behind them
        this.material.depthWrite = !transparent;

        // Apply a subtle polygon offset to translucent materials to help resolve z-fighting 
        // with solid geometry at shared boundaries (like glass touching stone).
        if (transparent) {
            this.material.polygonOffset = true;
            this.material.polygonOffsetFactor = -0.05;
            this.material.polygonOffsetUnits = -0.05;
        } else {
            this.material.polygonOffset = false;
        }
    }

    startDrawing() {
        this.addedVertices = 0;
        this.vertices = [];
        this.uv = [];
        this.colors = [];
        this.wavingWeights = [];
        this.wavingWeight = 0.0;
    }

    setColorRGB(red, green, blue) {
        this.red = red;
        this.green = green;
        this.blue = blue;
    }

    setColor(red, green, blue, alpha = 1) {
        this.setColorRGB(red, green, blue);
        this.setAlpha(alpha);
    }

    multiplyColor(red, green, blue, alpha = 1) {
        this.red *= red;
        this.green *= green;
        this.blue *= blue;
        this.alpha *= alpha;
    }

    setAlpha(alpha) {
        this.alpha = alpha;
    }

    addVertex(x, y, z) {
        // Validation check: prevent NaNs from entering vertex data, which causes black screens/GL crashes
        if (!isFinite(x) || !isFinite(y) || !isFinite(z)) {
            x = y = z = 0;
        }

        this.addedVertices++;

        // Add vertex
        this.vertices.push(x);
        this.vertices.push(y);
        this.vertices.push(z);

        // Add colors
        // Ensure color values are clamped and valid
        this.colors.push(isFinite(this.red) ? Math.max(0, Math.min(1, this.red)) : 1);
        this.colors.push(isFinite(this.green) ? Math.max(0, Math.min(1, this.green)) : 1);
        this.colors.push(isFinite(this.blue) ? Math.max(0, Math.min(1, this.blue)) : 1);
        this.colors.push(isFinite(this.alpha) ? Math.max(0, Math.min(1, this.alpha)) : 1);

        // Add waving weight
        this.wavingWeights.push(isFinite(this.wavingWeight) ? this.wavingWeight : 0.0);
    }

    addVertexWithUV(x, y, z, u, v) {
        this.addVertex(x, y, z);

        // Add UV
        this.uv.push(u);
        this.uv.push(v);
    }

    transformBrightness(brightness) {
        for (let i = 0; i < this.colors.length / 4; i++) {
            this.colors[i * 4 + 0] *= brightness;
            this.colors[i * 4 + 1] *= brightness;
            this.colors[i * 4 + 2] *= brightness;
        }
    }

    draw(group) {
        if (this.addedVertices === 0) {
            return null;
        }

        let geometry = new THREE.BufferGeometry();
        
        // Optimization: Use direct typed arrays for vertex data to avoid repeated allocations
        const posArray = new Float32Array(this.vertices);
        const colorArray = new Float32Array(this.colors);
        const wavingArray = new Float32Array(this.wavingWeights);

        geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 4));
        geometry.setAttribute('waving', new THREE.BufferAttribute(wavingArray, 1));
        
        // Generate normals for lighting/gloss effects
        const normals = new Float32Array(this.addedVertices * 3);
        for(let i=0; i<this.addedVertices; i+=4) {
            // Basic face normal calculation for quads
            const p0 = new THREE.Vector3(this.vertices[i*3], this.vertices[i*3+1], this.vertices[i*3+2]);
            const p1 = new THREE.Vector3(this.vertices[(i+1)*3], this.vertices[(i+1)*3+1], this.vertices[(i+1)*3+2]);
            const p2 = new THREE.Vector3(this.vertices[(i+2)*3], this.vertices[(i+2)*3+1], this.vertices[(i+2)*3+2]);
            const v1 = new THREE.Vector3().subVectors(p1, p0);
            const v2 = new THREE.Vector3().subVectors(p2, p0);
            
            // Calculate cross product
            const n = new THREE.Vector3().crossVectors(v1, v2);
            
            // Fix: Check for zero-length vector to prevent NaN normals that cause black screens
            if (n.lengthSq() > 0.0000001) {
                n.normalize();
            } else {
                // Default to up normal for degenerated/zero-area faces
                n.set(0, 1, 0);
            }

            for(let j=0; j<4; j++) {
                normals[(i+j)*3] = n.x;
                normals[(i+j)*3+1] = n.y;
                normals[(i+j)*3+2] = n.z;
            }
        }
        geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));

        if (this.uv.length > 0) {
            const uvArray = new Float32Array(this.uv);
            geometry.setAttribute('uv', new THREE.BufferAttribute(uvArray, 2));
        }

        // Create index array using shared static buffer for quad indices
        // This avoids creating thousands of small identical typed arrays per frame
        const faceCount = this.addedVertices / 4;
        const indexCount = faceCount * 6;
        
        if (!Tessellator.sharedIndexArray || Tessellator.sharedIndexArray.length < indexCount) {
            const newSize = Math.max(indexCount, (Tessellator.sharedIndexArray ? Tessellator.sharedIndexArray.length * 2 : 6144));
            Tessellator.sharedIndexArray = new Uint32Array(newSize);
            for (let i = 0, v = 0; i < newSize; i += 6, v += 4) {
                Tessellator.sharedIndexArray[i + 0] = v + 0;
                Tessellator.sharedIndexArray[i + 1] = v + 2;
                Tessellator.sharedIndexArray[i + 2] = v + 1;
                Tessellator.sharedIndexArray[i + 3] = v + 0;
                Tessellator.sharedIndexArray[i + 4] = v + 3;
                Tessellator.sharedIndexArray[i + 5] = v + 2;
            }
        }
        
        geometry.setIndex(new THREE.BufferAttribute(Tessellator.sharedIndexArray.subarray(0, indexCount), 1));

        let matClone = this.material.clone();
        
        // Manual deep-cloning logic for uniforms/hooks
        if (this.isGlint) {
            // Re-link shared animated uniforms
            matClone.uniforms.glintMatrix = this.material.uniforms.glintMatrix;
            matClone.uniforms.alphaTransform = this.material.uniforms.alphaTransform;
            matClone.uniforms.alphaMap = this.material.uniforms.alphaMap;
            matClone.uniforms.useAlpha = this.material.uniforms.useAlpha;
            matClone.uniforms.brightness = this.material.uniforms.brightness;
            matClone.uniforms.glintColor = this.material.uniforms.glintColor;
            matClone.uniforms.glintAlpha = this.material.uniforms.glintAlpha;
        } else {
            matClone.onBeforeCompile = this.material.onBeforeCompile;
            matClone.customProgramCacheKey = this.material.customProgramCacheKey;
        }

        let mesh = new THREE.Mesh(geometry, matClone);
        mesh.userData.isTessellated = true;
        group.add(mesh);
        return mesh;
    }

}