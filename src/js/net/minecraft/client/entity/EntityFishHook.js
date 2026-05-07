import Entity from "./Entity.js";
import BoundingBox from "../../util/BoundingBox.js";
import Vector3 from "../../util/Vector3.js";
import Block from "../world/block/Block.js";
import DroppedItem from "./DroppedItem.js";
import { BlockRegistry } from "../world/block/BlockRegistry.js";

export default class EntityFishHook extends Entity {
    static name = "EntityFishHook";

    constructor(minecraft, world, owner) {
        super(minecraft, world);
        this.owner = owner;
        this.setSize(0.25, 0.25);
        
        this.inGround = false;
        this.inWater = false;
        this.ticksInAir = 0;
        this.ticksInGround = 0;
        
        this.bobOffset = Math.random() * Math.PI * 2;
        
        this.waitTimer = 0;
        this.biteTimer = 0;
        this.hookedEntity = null;
    }

    setSize(w, h) {
        this.width = w;
        this.height = h;
        this.boundingBox = new BoundingBox(this.x - w/2, this.y, this.z - w/2, this.x + w/2, this.y + h, this.z + w/2);
    }

    onUpdate() {
        super.onUpdate();

        // Check if owner is still holding rod
        if (!this.owner || this.owner.isDead || (this.owner.inventory && this.owner.inventory.getItemInSelectedSlot() !== 346)) {
            this.remove();
            return;
        }

        // Check distance
        let dx = this.x - this.owner.x;
        let dy = this.y - this.owner.y;
        let dz = this.z - this.owner.z;
        let distSq = dx*dx + dy*dy + dz*dz;
        if (distSq > 1024) { // 32 blocks
            this.remove();
            return;
        }

        // Handle hooked entity attachment
        if (this.hookedEntity) {
            if (this.hookedEntity.isDead || distSq > 1024) {
                this.hookedEntity = null;
            } else {
                // Update bobber to follow entity center
                let bb = this.hookedEntity.boundingBox;
                this.x = (bb.minX + bb.maxX) / 2;
                this.y = (bb.minY + bb.maxY) / 2;
                this.z = (bb.minZ + bb.maxZ) / 2;
                this.setPosition(this.x, this.y, this.z);
                return;
            }
        }

        if (this.inGround) {
            this.ticksInGround++;
            if (this.ticksInGround > 1200) this.remove();
            return;
        }

        this.ticksInAir++;

        // Water check
        let blockId = this.world.getBlockAt(Math.floor(this.x), Math.floor(this.y), Math.floor(this.z));
        this.inWater = (blockId === 9 || blockId === 8);

        if (this.inWater) {
            // Floating logic: Increased drag to reduce sliding
            this.motionX *= 0.75;
            this.motionZ *= 0.75;
            
            // Buoyancy
            let waterLevel = Math.floor(this.y) + 1.0;
            let targetY = waterLevel - 0.1;
            
            // Fishing state machine
            if (this.biteTimer > 0) {
                this.biteTimer--;
                targetY -= 0.6; // Dipped!
                if (this.biteTimer <= 0) {
                    this.waitTimer = 100 + Math.random() * 400; // Reset wait
                }
            } else {
                if (this.waitTimer > 0) {
                    this.waitTimer--;
                } else {
                    // Start bite!
                    this.biteTimer = 20; // 1 second bite window
                    this.minecraft.soundManager.playSound("random.splash", this.x, this.y, this.z, 0.8, 1.0);
                }
                // Idle bobbing
                targetY += Math.sin(this.ticksExisted * 0.1 + this.bobOffset) * 0.05;
            }
            
            this.motionY += (targetY - this.y) * 0.1;
            this.motionY *= 0.8;
            
            this.move(this.motionX, this.motionY, this.motionZ);
        } else {
            // Reset timers if out of water
            this.waitTimer = 100 + Math.random() * 400;
            this.biteTimer = 0;

            // Normal projectile physics
            let vec3 = new Vector3(this.x, this.y, this.z);
            let nextVec3 = new Vector3(this.x + this.motionX, this.y + this.motionY, this.z + this.motionZ);
            let hit = this.world.rayTraceBlocks(vec3, nextVec3, false);

            if (hit) {
                this.x = hit.vector.x;
                this.y = hit.vector.y;
                this.z = hit.vector.z;
                this.inGround = true;
                this.motionX = this.motionY = this.motionZ = 0;
                return;
            }

            // Entity collision
            for (let entity of this.world.entities) {
                if (entity !== this.owner && entity.canBeCollidedWith && this.ticksInAir > 3) {
                    if (entity.boundingBox.intersects(this.boundingBox.expand(this.motionX, this.motionY, this.motionZ))) {
                        // Hook entity!
                        this.hookedEntity = entity;
                        this.minecraft.soundManager.playSound("random.bowhit", this.x, this.y, this.z, 1.0, 1.2);
                        return;
                    }
                }
            }

            this.move(this.motionX, this.motionY, this.motionZ);
            
            this.motionX *= 0.99;
            this.motionY *= 0.99;
            this.motionZ *= 0.99;
            this.motionY -= 0.04; // Gravity
        }

        this.setPosition(this.x, this.y, this.z);
    }

    move(dx, dy, dz) {
        let boundingBoxList = this.world.getCollisionBoxes(this.boundingBox.expand(dx, dy, dz));

        for (const bb of boundingBoxList) dy = bb.clipYCollide(this.boundingBox, dy);
        this.boundingBox.move(0, dy, 0);
        for (const bb of boundingBoxList) dx = bb.clipXCollide(this.boundingBox, dx);
        this.boundingBox.move(dx, 0, 0);
        for (const bb of boundingBoxList) dz = bb.clipZCollide(this.boundingBox, dz);
        this.boundingBox.move(0, 0, dz);

        this.onGround = dy !== this.motionY && this.motionY < 0;

        if (dx !== this.motionX) this.motionX = 0;
        if (dy !== this.motionY) this.motionY = 0;
        if (dz !== this.motionZ) this.motionZ = 0;

        this.x = (this.boundingBox.minX + this.boundingBox.maxX) / 2.0;
        this.y = this.boundingBox.minY;
        this.z = (this.boundingBox.minZ + this.boundingBox.maxZ) / 2.0;
    }

    reelIn() {
        if (this.biteTimer > 0) {
            // Success! Spawn loot
            this.spawnLoot();
        } else if (this.hookedEntity) {
            // Pull entity
            this.pullEntity();
        }
        
        this.remove();
    }

    spawnLoot() {
        this.minecraft.stats.fishCaught++;
        
        // Revised Loot Pool per instructions
        const lootPool = [
            // Common (Weight 12 each -> 72 Total)
            { id: 349, weight: 12 }, // Fish (Raw Cod)
            { id: 334, weight: 12 }, // Leather
            { id: 287, weight: 12 }, // String
            { id: 280, weight: 12 }, // Stick
            { id: 281, weight: 12 }, // Bowl
            { id: 354, weight: 12 }, // Fish (Raw Salmon)

            // Uncommon (Weight 5 each -> 20 Total)
            { id: 550, weight: 5 },  // Glass Bottle
            { id: 262, weight: 5 },  // Arrow
            { id: 346, weight: 5 },  // Fishing Rod
            { id: 352, weight: 5 },  // Bone

            // Rare (Weight 2 each -> 8 Total)
            { id: 408, weight: 2 },  // Saddle
            { id: 'enchanted_book', weight: 2 },
            { id: 414, weight: 2 },  // Name Tag
            { id: 261, weight: 2 }   // Bow
        ];
        
        let total = lootPool.reduce((sum, item) => sum + item.weight, 0);
        let r = Math.random() * total;
        let selected = lootPool[0];
        for (let item of lootPool) {
            if (r < item.weight) {
                selected = item;
                break;
            }
            r -= item.weight;
        }

        let finalId = selected.id;
        let tag = {};

        // Resolve Enchanted Book ID (Random from registered books)
        if (finalId === 'enchanted_book') {
            finalId = 3000 + Math.floor(Math.random() * 135);
        }

        // Apply Enchantment Distribution logic
        const enchantRoll = Math.random() * 100;
        let enchantCount = 0;
        if (enchantRoll < 5) enchantCount = 4;        // 5% chance
        else if (enchantRoll < 25) enchantCount = 3;  // 20% chance
        else if (enchantRoll < 85) enchantCount = 2;  // 60% chance
        else if (enchantRoll < 95) enchantCount = 1;  // 10% chance
        // remaining 5% get 0 enchantments

        if (enchantCount > 0) {
            // Define valid enchantment pools for different item types
            const pools = {
                "armor": ["protection", "fire_protection", "blast_protection", "projectile_protection", "thorns", "unbreaking"],
                "boots": ["feather_falling", "depth_strider", "frost_walker"],
                "sword": ["sharpness", "smite", "bane_of_arthropods", "knockback", "fire_aspect", "looting", "unbreaking"],
                "tool": ["efficiency", "silk_touch", "fortune", "unbreaking"],
                "bow": ["power", "punch", "flame", "infinity", "unbreaking"],
                "crossbow": ["quick_charge", "piercing", "multishot", "unbreaking"],
                "fishing_rod": ["luck_of_the_sea", "lure", "unbreaking"],
                "book": ["sharpness", "efficiency", "unbreaking", "protection", "power", "luck_of_the_sea", "lure", "thorns", "feather_falling", "depth_strider", "frost_walker", "punch", "flame", "infinity", "quick_charge", "piercing", "multishot"]
            };

            let itemPool = null;
            const block = Block.getById(finalId);
            
            // Categorize the item to select the right pool
            if (finalId >= 3000) itemPool = pools.book;
            else if (finalId === 346) itemPool = pools.fishing_rod;
            else if (finalId === 261) itemPool = pools.bow;
            else if (finalId === 499) itemPool = pools.crossbow;
            else if ([267, 268, 272, 276, 283].includes(finalId)) itemPool = pools.sword;
            else if ([256, 257, 258, 269, 270, 271, 273, 274, 275, 277, 278, 279, 284, 285, 286, 290, 291, 292, 293, 294].includes(finalId)) itemPool = pools.tool;
            else if (block && block.armorType !== undefined) {
                itemPool = [...pools.armor];
                if (block.armorType === 3) itemPool.push(...pools.boots); // Boots specific
            }

            // Only enchant if the item is in our whitelist
            if (itemPool) {
                tag.enchanted = true;
                tag.enchantments = {};
                for (let i = 0; i < enchantCount; i++) {
                    const name = itemPool[Math.floor(Math.random() * itemPool.length)];
                    // Random level 1-3
                    const level = Math.floor(Math.random() * 3) + 1;
                    tag.enchantments[name] = Math.max(tag.enchantments[name] || 0, level);
                }
            }
        }

        const drop = new DroppedItem(this.world, this.x, this.y + 0.5, this.z, finalId, 1, tag);
        drop.pickupDelay = 0; // Make instantly collectible for fishing success
        
        // Calculate vector to player
        let dx = this.owner.x - this.x;
        let dy = (this.owner.y + 1.0) - this.y;
        let dz = this.owner.z - this.z;
        let dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist > 0) {
            let speed = 0.2 + dist * 0.05;
            drop.motionX = (dx / dist) * speed;
            drop.motionY = (dy / dist) * speed + 0.2;
            drop.motionZ = (dz / dist) * speed;
        }
        
        this.world.droppedItems.push(drop);
        this.minecraft.soundManager.playSound("random.pop", this.x, this.y, this.z, 0.5, 1.2);
    }

    pullEntity() {
        if (!this.hookedEntity) return;
        
        let dx = this.owner.x - this.hookedEntity.x;
        let dy = (this.owner.y + 1.0) - this.hookedEntity.y;
        let dz = this.owner.z - this.hookedEntity.z;
        let dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist > 0) {
            let pullForce = 0.6;
            // Negate X and Z force because EntityLiving displacement is -motionX/-motionZ
            this.hookedEntity.motionX -= (dx / dist) * pullForce;
            this.hookedEntity.motionY += (dy / dist) * pullForce + 0.2;
            this.hookedEntity.motionZ -= (dz / dist) * pullForce;
        }
    }

    remove() {
        if (this.owner && this.owner.fishEntity === this) {
            this.owner.fishEntity = null;
        }
        this.world.removeEntityById(this.id);
    }
}