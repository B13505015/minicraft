class MinecraftGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.world = new World();
        this.player = new Player(0, 120, 0);
        
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };

        this.setupEventListeners();
        this.gameLoop();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w': this.input.forward = true; break;
                case 's': this.input.backward = true; break;
                case 'a': this.input.left = true; break;
                case 'd': this.input.right = true; break;
                case ' ': this.input.jump = true; break;
                case 'e': this.toggleInventory(); break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch(e.key.toLowerCase()) {
                case 'w': this.input.forward = false; break;
                case 's': this.input.backward = false; break;
                case 'a': this.input.left = false; break;
                case 'd': this.input.right = false; break;
                case ' ': this.input.jump = false; break;
            }
        });

        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });

        // 初始化畫布大小
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    toggleInventory() {
        const modal = document.getElementById('inventoryModal');
        modal.classList.toggle('hidden');
    }

    renderWorld() {
        // 簡化的世界渲染
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 繪製地平線
        const horizon = this.canvas.height * 0.6;
        this.ctx.fillStyle = '#228b22';
        this.ctx.fillRect(0, horizon, this.canvas.width, this.canvas.height - horizon);

        // 繪製簡單的區塊
        const blockSize = 40;
        const screenCenterX = this.canvas.width / 2;
        const screenCenterY = this.canvas.height / 2;

        for (let x = -5; x < 6; x++) {
            for (let z = -5; z < 6; z++) {
                const blockX = Math.floor(this.player.pos.x) + x;
                const blockZ = Math.floor(this.player.pos.z) + z;
                const blockY = Math.floor(this.player.pos.y) - 1;

                const terrain = this.world.getBlock(blockX, blockY, blockZ);
                if (terrain) {
                    const screenX = screenCenterX + x * blockSize;
                    const screenY = screenCenterY + z * blockSize;

                    this.ctx.fillStyle = TERRAIN_TYPES[terrain].color;
                    this.ctx.fillRect(screenX, screenY, blockSize - 2, blockSize - 2);
                    this.ctx.strokeStyle = '#000';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(screenX, screenY, blockSize - 2, blockSize - 2);
                }
            }
        }
    }

    renderHUD() {
        const info = this.player.getInfo();
        
        // 座標
        document.getElementById('position').textContent = `座標: ${info.position}`;
        
        // 健康
        document.getElementById('health').textContent = `❤️ ${info.health}/${this.player.maxHealth}`;

        // 十字
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(cx - 10, cy);
        this.ctx.lineTo(cx + 10, cy);
        this.ctx.moveTo(cx, cy - 10);
        this.ctx.lineTo(cx, cy + 10);
        this.ctx.stroke();
    }

    gameLoop() {
        this.player.update(this.input);
        this.renderWorld();
        this.renderHUD();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// 啟動遊戲
window.addEventListener('load', () => {
    new MinecraftGame();
}