// 地形類型定義
const TERRAIN_TYPES = {
    grass: {
        name: '草地',
        color: '#2d5016',
        rgb: [45, 80, 22],
        hardness: 0.6,
        canBreak: true,
        drops: ['dirt', 'grass']
    },
    stone: {
        name: '石頭',
        color: '#808080',
        rgb: [128, 128, 128],
        hardness: 1.5,
        canBreak: true,
        drops: ['stone']
    },
    dirt: {
        name: '泥土',
        color: '#8b7355',
        rgb: [139, 115, 85],
        hardness: 0.5,
        canBreak: true,
        drops: ['dirt']
    },
    sand: {
        name: '沙子',
        color: '#daa520',
        rgb: [218, 165, 32],
        hardness: 0.5,
        canBreak: true,
        drops: ['sand']
    },
    water: {
        name: '水',
        color: '#4a90e2',
        rgb: [74, 144, 226],
        hardness: 100,
        canBreak: false,
        drops: []
    },
    tree_log: {
        name: '樹幹',
        color: '#8b4513',
        rgb: [139, 69, 19],
        hardness: 2,
        canBreak: true,
        drops: ['wood']
    },
    tree_leaves: {
        name: '樹葉',
        color: '#228b22',
        rgb: [34, 139, 34],
        hardness: 0.2,
        canBreak: true,
        drops: ['stick', 'apple']
    }
};

// 物品定義
const ITEMS = {
    dirt: { name: '泥土', icon: '🟫' },
    grass: { name: '草', icon: '🟩' },
    stone: { name: '石頭', icon: '⬜' },
    sand: { name: '沙子', icon: '🟨' },
    wood: { name: '木材', icon: '📦' },
    stick: { name: '木棍', icon: '🔨' },
    apple: { name: '蘋果', icon: '🍎' }
};
