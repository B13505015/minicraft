// 簡單的 Perlin 噪聲實現
class PerlinNoise {
    constructor(seed = 0) {
        this.seed = seed;
    }

    noise(x, y) {
        const n = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
        return n - Math.floor(n);
    }

    smoothNoise(x, y) {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const xf = x - xi;
        const yf = y - yi;

        const n00 = this.noise(xi, yi);
        const n10 = this.noise(xi + 1, yi);
        const n01 = this.noise(xi, yi + 1);
        const n11 = this.noise(xi + 1, yi + 1);

        const u = xf * xf * (3 - 2 * xf);
        const v = yf * yf * (3 - 2 * yf);

        const nx0 = n00 * (1 - u) + n10 * u;
        const nx1 = n01 * (1 - u) + n11 * u;
        return nx0 * (1 - v) + nx1 * v;
    }

    perlin(x, y) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;

        for (let i = 0; i < 4; i++) {
            total += this.smoothNoise(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            frequency *= 2;
            amplitude *= 0.5;
        }

        return total / maxValue;
    }
}

class World {
    constructor(seed = Math.random() * 1000) {
        this.seed = seed;
        this.perlin = new PerlinNoise(seed);
        this.chunks = new Map();
        this.chunkSize = 16;
    }

    generateChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        if (this.chunks.has(chunkKey)) {
            return this.chunks.get(chunkKey);
        }

        const chunk = [];
        for (let x = 0; x < this.chunkSize; x++) {
            chunk[x] = [];
            for (let z = 0; z < this.chunkSize; z++) {
                chunk[x][z] = [];
                
                const worldX = chunkX * this.chunkSize + x;
                const worldZ = chunkZ * this.chunkSize + z;
                
                // 生成高度圖
                const height = this.getHeight(worldX, worldZ);
                
                for (let y = 0; y < 256; y++) {
                    if (y < height - 3) {
                        chunk[x][z][y] = 'stone';
                    } else if (y < height) {
                        chunk[x][z][y] = 'dirt';
                    } else if (y === height) {
                        chunk[x][z][y] = 'grass';
                    } else if (y < height + 1 && this.perlin.perlin(worldX * 0.1, worldZ * 0.1) > 0.6) {
                        chunk[x][z][y] = 'water';
                    } else {
                        chunk[x][z][y] = null;
                    }
                }
            }
        }

        this.chunks.set(chunkKey, chunk);
        return chunk;
    }

    getHeight(x, z) {
        const heightValue = this.perlin.perlin(x * 0.05, z * 0.05);
        return Math.floor(heightValue * 60 + 64);
    }

    getBlock(x, y, z) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localZ = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;

        const chunk = this.generateChunk(chunkX, chunkZ);
        if (y >= 0 && y < 256) {
            return chunk[localX][localZ][y];
        }
        return null;
    }

    setBlock(x, y, z, blockType) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        const localX = ((x % this.chunkSize) + this.chunkSize) % this.chunkSize;
        const localZ = ((z % this.chunkSize) + this.chunkSize) % this.chunkSize;

        const chunk = this.generateChunk(chunkX, chunkZ);
        if (y >= 0 && y < 256) {
            chunk[localX][localZ][y] = blockType;
        }
    }
}