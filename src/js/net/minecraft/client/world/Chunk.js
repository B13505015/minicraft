import EnumSkyBlock from "../../util/EnumSkyBlock.js";
import Block from "./block/Block.js";
import World from "./World.js";
import ChunkSection from "./ChunkSection.js";
import * as THREE from "../../../../../../libraries/three.module.js";

export default class Chunk {

    static SECTION_AMOUNT = 16;

    constructor(world, x, z) {
        this.world = world;
        this.x = x;
        this.z = z;

        this.group = new THREE.Object3D();
        this.group.matrixAutoUpdate = false;
        this.group.chunkX = x;
        this.group.chunkZ = z;

        this.loaded = false;
        this.isTerrainPopulated = false;
        this.isDirty = false; // Track if chunk has player modifications

        // Initialize sections
        this.sections = [];
        for (let y = 0; y < Chunk.SECTION_AMOUNT; y++) {
            let section = new ChunkSection(world, this, x, y, z);

            this.sections[y] = section;
            this.group.add(section.group);
        }

        // Create height map and initialize with 0 to prevent "above ground" check failures during initial lighting passes
        this.heightMap = new Int16Array(256).fill(0);

        // Timer for high-frequency refresh bursts (0.1s for 5s)
        this.refreshTimer = 0;
    }

    markDirty() {
        this.isDirty = true;
    }

    generateSkylightMap() {
        // Initialize all sky light to 0 first to ensure a clean slate
        for (let i = 0; i < Chunk.SECTION_AMOUNT; i++) {
            this.sections[i].skyLight.fill(0);
        }

        if (this.world.dimension === -1) {
            for (let i = 0; i < 16 * 16; i++) this.heightMap[i] = 127;
            this.setModifiedAllSections();
            return;
        }

        // Optimization: Pre-fill height map if empty
        if (this.heightMap.length === 0) {
            for (let i = 0; i < 256; i++) this.heightMap[i] = 0;
        }

        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                // Recalculate heightmap for safety
                let h = this.calculateHeightAt(x, z, World.TOTAL_HEIGHT);
                this.setHeightAt(x, z, h);
                
                // Above the highest opaque block, the sky light is always 15
                for (let y = World.TOTAL_HEIGHT; y >= h; y--) {
                    this.setLightAt(EnumSkyBlock.SKY, x, y, z, 15);
                }

                // Handle World Edge: check if light should flow into the chunk from the sky if not in Nether
                if (this.world.dimension !== -1 && h < World.TOTAL_HEIGHT) {
                     // sunlight is guaranteed above the surface heightmap
                }
                
                // Below the surface, propagate light downward with opacity attenuation
                let light = 15;
                for (let y = h - 1; y >= 0; y--) {
                    let id = this.getBlockAt(x, y, z);
                    if (id === 0) {
                        // Air still attenuates light slightly to prevent infinite horizontal reach in voids
                        light -= 1;
                    } else {
                        let block = Block.getById(id);
                        let opacity = block ? Math.round(block.getOpacity() * 15) : 15;
                        // Minimum attenuation of 1 for non-light sources
                        light -= Math.max(1, opacity);
                    }
                    if (light < 0) light = 0;
                    this.setLightAt(EnumSkyBlock.SKY, x, y, z, light);
                }
            }
        }

        this.world.updateLight(EnumSkyBlock.SKY, this.x << 4, 0, this.z << 4, (this.x << 4) + 15, 127, (this.z << 4) + 15, false);
        this.setModifiedAllSections();
    }

    generateBlockLightMap() {
        for (let x = 0; x < 16; x++) {
            for (let z = 0; z < 16; z++) {
                for (let y = 0; y < World.TOTAL_HEIGHT; y++) {
                    let typeId = this.getBlockAt(x, y, z);
                    if (typeId !== 0) {
                        let block = Block.getById(typeId);
                        let blockLight = block.getLightValue(this.world, (this.x << 4) + x, y, (this.z << 4) + z);
                        if (blockLight > 0) {
                            this.setLightAt(EnumSkyBlock.BLOCK, x, y, z, blockLight);
                        }
                    }
                }
            }
        }

        this.world.updateLight(EnumSkyBlock.BLOCK, this.x << 4, 0, this.z << 4, (this.x << 4) + 15, 127, (this.z << 4) + 15, false);
        this.setModifiedAllSections();
    }

    updateBlockLight() {
        this.setModifiedAllSections();
    }

    notifyNeighbors(x, z) {
        let height = this.getHeightAt(x, z);
        let totalX = this.x * 16 + x;
        let totalZ = this.z * 16 + z;

        this.updateSkyLight(totalX - 1, totalZ, height);
        this.updateSkyLight(totalX + 1, totalZ, height);
        this.updateSkyLight(totalX, totalZ - 1, height);
        this.updateSkyLight(totalX, totalZ + 1, height);
    }

    updateSkyLight(x, z, y) {
        let height = this.world.getHeightAt(x, z);
        if (height > y) {
            this.world.updateLight(EnumSkyBlock.SKY, x, y, z, x, height, z);
        } else if (height < y) {
            this.world.updateLight(EnumSkyBlock.SKY, x, height, z, x, y, z);
        }
        this.setModifiedAllSections();
    }

    updateHeightMap(relX, y, relZ) {
        let currentHighestY = this.getHeightAt(relX, relZ);
        let highestY = currentHighestY;
        if (y > currentHighestY) highestY = y;

        if (y < currentHighestY - 1) return;

        highestY = this.calculateHeightAt(relX, relZ, highestY);
        if (highestY === currentHighestY) return;

        this.setHeightAt(relX, relZ, highestY);

        let x = this.x * 16 + relX;
        let z = this.z * 16 + relZ;

        if (highestY < currentHighestY) {
            for (let hy = highestY; hy < currentHighestY; hy++) {
                this.setLightAt(EnumSkyBlock.SKY, relX, hy, relZ, 15);
            }
        } else {
            this.world.updateLight(EnumSkyBlock.SKY, x, currentHighestY, z, x, highestY, z);
            for (let hy = currentHighestY; hy < highestY; hy++) {
                this.setLightAt(EnumSkyBlock.SKY, relX, hy, relZ, 0);
            }
        }

        let lightLevel = 15;
        let prevHeight = highestY;
        while (highestY > 0 && lightLevel > 0) {
            highestY--;
            let typeId = this.sections[highestY >> 4].getBlockAt(relX, highestY & 15, relZ);
            let opacity = typeId === 0 ? 1 : Math.round(Block.getById(typeId).getOpacity() * 15);
            if (opacity === 0) opacity = 1;
            lightLevel -= opacity;
            if (lightLevel < 0) lightLevel = 0;
            this.setLightAt(EnumSkyBlock.SKY, relX, highestY, relZ, lightLevel);
        }

        highestY = this.calculateHeightAt(relX, relZ, highestY);
        if (highestY !== prevHeight) {
            this.world.updateLight(EnumSkyBlock.SKY, x - 1, highestY, z - 1, x + 1, prevHeight, z + 1);
        }
        this.setModifiedAllSections();
    }

    calculateHeightAt(x, z, startY) {
        // Scan downwards from the top of the world to find the highest solid block
        // startY is clamped to the true world ceiling (127)
        let checkY = Math.min(128, startY + 1); 
        for (let y = checkY; y > 0; y--) {
            let typeId = this.getBlockAt(x, y - 1, z);
            if (typeId === 0) continue;
            
            let block = Block.getById(typeId);
            // Heightmap only tracks blocks that truly obstruct skylight (opacity > 0)
            if (block && block.getOpacity() > 0) {
                return y;
            }
        }
        return 0;
    }

    updateHeightMapAt(x, z) {
        // Re-scan from top down for the highest block in this column
        let y = this.calculateHeightAt(x, z, 127);
        this.setHeightAt(x, z, y);
    }

    setHeightAt(x, z, height) {
        this.heightMap[z << 4 | x] = height;
    }

    /**
     * Is the highest solid block or above
     */
    isHighestBlock(x, y, z) {
        return y >= this.getHighestBlockAt(x, z);
    }

    /**
     * Is above the highest solid block
     */
    isAboveGround(x, y, z) {
        return y >= this.getHeightAt(x, z);
    }

    /**
     * Get the first non-solid block
     */
    getHeightAt(x, z) {
        return this.heightMap[z << 4 | x];
    }

    /**
     * Get the highest solid block
     */
    getHighestBlockAt(x, z) {
        return this.getHeightAt(x, z) - 1;
    }

    setLightAt(sourceType, x, y, z, level) {
        this.sections[y >> 4].setLightAt(sourceType, x, y & 15, z, level);
    }

    setBlockDataAt(x, y, z, data) {
        this.setBlockAt(x, y, z, this.getBlockAt(x, y, z), data);
    }

    setBlockAt(x, y, z, typeId, data = 0) {
        let section = this.sections[y >> 4];
        let yInSection = y & 15;

        let height = this.getHeightAt(x, z);
        let prevTypeId = section.getBlockAt(x, yInSection, z);
        let prevData = section.getBlockDataAt(x, yInSection, z);

        if (prevTypeId === typeId && prevData === data) {
            return false;
        }

        this.isDirty = true;

        section.setBlockAt(x, yInSection, z, typeId);
        section.setBlockDataAt(x, yInSection, z, data);

        if (!this.loaded) {
            return;
        }

        // Update height map
        let block = Block.getById(typeId);
        if (typeId !== 0 && block.isSolid()) {
            if (y >= height) {
                this.updateHeightMap(x, y + 1, z);
            }
        } else if (y === height - 1) {
            this.updateHeightMap(x, y, z);
        }

        let totalX = this.x * 16 + x;
        let totalZ = this.z * 16 + z;

        // Update light
        this.world.updateLight(EnumSkyBlock.SKY, totalX, y, totalZ, totalX, y, totalZ);
        this.world.updateLight(EnumSkyBlock.BLOCK, totalX, y, totalZ, totalX, y, totalZ);

        // Notify surrounding blocks
        this.notifyNeighbors(x, z);

        // Handle block abilities
        if (typeId !== 0) {
            block.onBlockAdded(this.world, totalX, y, totalZ);
        }

        return true;
    }

    setBlockId(x, y, z, typeId, data = 0) {
        let section = this.getSection(y >> 4);
        section.setBlockAt(x, y & 15, z, typeId);
        if (data !== 0) section.setBlockDataAt(x, y & 15, z, data);
    }

    getBlockID(x, y, z) {
        return this.sections[y >> 4].getBlockAt(x, y & 15, z);
    }

    getBlockAt(x, y, z) {
        return this.sections[y >> 4].getBlockAt(x, y & 15, z);
    }

    getBlockDataAt(x, y, z) {
        return this.sections[y >> 4].getBlockDataAt(x, y & 15, z);
    }

    getSection(y) {
        return this.sections[y];
    }

    rebuild(renderer) {
        for (let y = 0; y < this.sections.length; y++) {
            this.sections[y].rebuild(renderer);
        }
    }

    isLoaded() {
        return this.loaded;
    }

    unload() {
        this.loaded = false;
    }

    setModifiedAllSections() {
        for (let y = 0; y < this.sections.length; y++) {
            this.sections[y].isModified = true;
        }
    }
}