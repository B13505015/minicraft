class Inventory {
    constructor(maxSlots = 36) {
        this.items = [];
        this.maxSlots = maxSlots;
        this.selectedSlot = 0;
        this.initializeSlots();
    }

    initializeSlots() {
        for (let i = 0; i < this.maxSlots; i++) {
            this.items.push({ type: null, count: 0 });
        }
    }

    addItem(itemType, count = 1) {
        // 查找已存在的物品
        for (let item of this.items) {
            if (item.type === itemType && item.count < 64) {
                const canAdd = Math.min(count, 64 - item.count);
                item.count += canAdd;
                count -= canAdd;
                if (count === 0) return true;
            }
        }

        // 找空槽位
        for (let item of this.items) {
            if (item.type === null) {
                item.type = itemType;
                item.count = count;
                return true;
            }
        }

        return false; // 背包滿了
    }

    removeItem(itemType, count = 1) {
        for (let item of this.items) {
            if (item.type === itemType && item.count > 0) {
                const removed = Math.min(count, item.count);
                item.count -= removed;
                if (item.count === 0) item.type = null;
                count -= removed;
                if (count === 0) return true;
            }
        }
        return count === 0;
    }

    getItem(slotIndex) {
        return this.items[slotIndex];
    }

    setItem(slotIndex, itemType, count) {
        this.items[slotIndex] = { type: itemType, count };
    }

    render(ctx, x, y) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, 300, 300);

        for (let i = 0; i < this.maxSlots; i++) {
            const slotX = x + (i % 6) * 50;
            const slotY = y + Math.floor(i / 6) * 50;
            
            // 繪製槽位
            ctx.strokeStyle = '#8b7355';
            ctx.lineWidth = 2;
            ctx.strokeRect(slotX, slotY, 50, 50);

            // 繪製物品
            const item = this.items[i];
            if (item.type) {
                ctx.fillStyle = '#6b5a45';
                ctx.fillRect(slotX, slotY, 50, 50);
                ctx.fillStyle = '#fff';
                ctx.font = '12px Arial';
                ctx.fillText(ITEMS[item.type].icon, slotX + 15, slotY + 30);
                ctx.fillText(item.count, slotX + 30, slotY + 45);
            }
        }
    }
}