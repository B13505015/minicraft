class Player {
    constructor(x = 0, y = 100, z = 0) {
        this.pos = { x, y, z };
        this.velocity = { x: 0, y: 0, z: 0 };
        this.rotation = { pitch: 0, yaw: 0 };
        this.inventory = new Inventory();
        this.health = 10;
        this.maxHealth = 10;
        this.hunger = 10;
        this.maxHunger = 10;
        this.isJumping = false;
        this.speed = 0.5;
        this.jumpPower = 15;
        this.gravity = 0.8;
    }

    update(input) {
        // 移動邏輯
        const moveSpeed = this.speed;
        
        if (input.forward) {
            this.velocity.z -= moveSpeed;
        }
        if (input.backward) {
            this.velocity.z += moveSpeed;
        }
        if (input.left) {
            this.velocity.x -= moveSpeed;
        }
        if (input.right) {
            this.velocity.x += moveSpeed;
        }

        // 跳躍
        if (input.jump && !this.isJumping) {
            this.velocity.y = this.jumpPower;
            this.isJumping = true;
        }

        // 重力
        this.velocity.y -= this.gravity;

        // 更新位置
        this.pos.x += this.velocity.x;
        this.pos.y += this.velocity.y;
        this.pos.z += this.velocity.z;

        // 碰撞檢測 (簡化)
        if (this.pos.y <= 0) {
            this.pos.y = 0;
            this.velocity.y = 0;
            this.isJumping = false;
        }

        // 摩擦
        this.velocity.x *= 0.9;
        this.velocity.z *= 0.9;
    }

    breakBlock(world, blockX, blockY, blockZ) {
        const terrain = world.getBlock(blockX, blockY, blockZ);
        if (terrain && TERRAIN_TYPES[terrain].canBreak) {
            const drops = TERRAIN_TYPES[terrain].drops;
            drops.forEach(item => this.inventory.addItem(item, 1));
            world.setBlock(blockX, blockY, blockZ, null);
        }
    }

    placeBlock(world, blockX, blockY, blockZ, blockType) {
        if (this.inventory.removeItem(blockType, 1)) {
            world.setBlock(blockX, blockY, blockZ, blockType);
        }
    }

    getInfo() {
        return {
            position: `${Math.floor(this.pos.x)}, ${Math.floor(this.pos.y)}, ${Math.floor(this.pos.z)}`,
            health: this.health,
            hunger: this.hunger
        };
    }
}