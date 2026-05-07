import Minecraft from './net/minecraft/client/Minecraft.js';

class Start {

    loadTexture(path) {
        return new Promise((resolve, reject) => {
            let image = new Image();
            // Handle root paths (../../) by stripping prefix and using root directly for robustness
            if (path.startsWith("../../")) {
                // Use relative path for root assets so they work across different URL structures
                image.src = "./" + path.substring(6);
            } else {
                image.src = "src/resources/" + path;
            }
            image.onload = () => resolve(image);
            image.onerror = () => {
                console.warn("Failed to load texture: " + path);
                // Return placeholder
                resolve(this.createPlaceholder());
            };
        });
    }

    createPlaceholder() {
        let canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        let ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FF00FF';
        ctx.fillRect(0, 0, 1, 1);
        return canvas;
    }

    async launch(canvasWrapperId) {
        // Global handler to avoid unhandledRejection noise (e.g. permissions denied for clipboard)
        if (typeof window !== "undefined" && !window.__mc_unhandled_rejection_installed) {
            window.__mc_unhandled_rejection_installed = true;
            window.addEventListener('unhandledrejection', (event) => {
                // Prevent errors when accessing event.reason or calling preventDefault (some browsers throw)
                try {
                    console.warn("Unhandled promise rejection caught:", event.reason);
                    try {
                        event.preventDefault();
                    } catch (e) {
                        // ignore preventDefault errors
                    }
                } catch (err) {
                    // If reading reason fails (e.g. permissions/opaque errors), log minimal info and still try to prevent default
                    console.warn("Unhandled promise rejection caught (unable to read reason)");
                    try { event.preventDefault(); } catch (_) {}
                }
            });
        }

        // Critical textures required for Main Menu and initial world loading
        const essential = [
            "gui/font.png",
            "gui/gui.png",
            "gui/background.png",
            "misc/grasscolor.png",
            "../../minecraftwebsimedition.png",
            "../../random stuff.png"
        ];

        // Game textures loaded in background
        const lazy = [
            "../../spawner.png",
            "../../structure_block (6).png",
            "../../minecart.png",
            "../../villagermob.gltf",
            "../../cat.gltf",
            "../../zombie_villager.gltf",
            "../../zombie_villager_spawn_egg.png",
            "../../cat_spawn_egg.png",
            "../../fishing_rod.png",
            "../../fishingbob.png",
            "../../birch_log.png",
            "../../birch_log_top.png",
            "../../birch_planks.png",
            "../../birch_sapling.png",
            "../../tall_grass_bottom.png",
            "../../tall_grass_top.png",
            "../../tools (1).png",
            "../../items (1).png",
            "../../water_flow (4).png",
            "../../flame.png",
            "../../foliage.png",
            "../../All doors.png",
            "../../paper.png",
            "../../sugar.png",
            "../../string.png",
            "../../iron_golem.gltf",
            "../../raw_fish.png",
            "../../birch_boat_icon.png",
            "../../spruce_boat_icon.png",
            "../../sprucelog.png",
            "../../spruceplanks.png",
            "../../sprucesaplings.png",
            "../../spruceleave.png",
            "../../bookshelf.png",
            "../../book.png",
            "../../white_tulip.png",
            "../../lily_of_the_valley.png",
            "../../wools.png",
            "../../farming.png",
            "../../beetroot (1).png",
            "../../dye.png",
            "../../food.png",
            "../../magma3sheet.png",
            "../../food2.png",
            "../../quartz.png",
            "../../clouds.png",
            "../../desert (3).png",
            "../../coloredglass.png",
            "../../treestuff.png",
            "../../sandstuff.png",
            "../../desert (1).png",
            "../../terracottahseet.png",
            "../../endstuff.png",
            "../../lava (4).png",
            "../../smoke.png",
            "../../rainweathe.png",
            "../../signs.png",
            "../../slimestuff.png",
            "../../redstonestuff.png",
            "../../crossbow.png",
            "../../note_block.png",
            "../../critandnote.png",
            "../../dicsandbox (1).png",
            "../../enchanted_glint_item.png",
            "../../advancements (1).png",
            "../../advancements (2).png",
            "../../bottles.png",
            "../../anvil_top.png",
            "../../anvil.png",
            "gui/title/minecraft.png",
            "gui/title/background/panorama_0.png",
            "gui/title/background/panorama_1.png",
            "gui/title/background/panorama_2.png",
            "gui/title/background/panorama_3.png",
            "gui/title/background/panorama_4.png",
            "gui/title/background/panorama_5.png",
            "gui/icons.png",
            "terrain/sun.png",
            "terrain/moon.png",
            "char.png",
            "terrain/terrain.png", // Add fallback terrain if needed
            "../../inventoryUIborder.png",
            "../../inventoryslot.png",
            "../../arrow (2).png",
            "../../favicon.ico",
            "../../projectlogo.png",
            "../../recipe_book.png",
            "../../arrow_0_0.png",
            "../../arrow.png",
            "../../blocks.png",
            "../../orestuff.png",
            "../../breakanimation.png",
            "../../All doors.png",
            "../../craftingtablesheet.png",
            "../../chest.png.png",
            "../../pumpkin.png.png",
            "../../anvil_top.png",
            "../../anvil.png",
            "../../dead_bush.png",
            "../../sugar_cane.png",
            "../../deadandsugar.png.png",
            "../../ladder.png",
            "../../nether.png",
            "../../zombie.png",
            "../../husk.png",
            "../../drowned.png",
            "../../zombieskin.png",
            "../../alex.png",
            "../../tuxedosteve.png",
            "../../plasticsteve.png",
            "../../steve.png",
            "../../steve (1).png",
            "../../technoblade.png",
            "../../notch.png",
            "../../alex (1).png",
            
            // Creative Inventory Tabs
            "../../tabselected_1_0 (2).png",
            "../../tabnotselected_0_0 (8).png",
            
            // Achievements
            "../../acquirehardware.png",
            "../../takinginventory.png",
            "../../timetomine.png",
            "../../gettinganupgrade.png",
            "../../gettingwood.png",
            "../../benchmaking.png",
            "../../timetostrike.png",
            "../../DIAMONDS.png",
            "../../Cowtipper.png",
            "../../Intothenether.png",
            "../../Thehaggler.png",
            "../../Timetofarmadvancement.png",
            "../../hottopic.png",
            "../../bakebread.png",
            "../../porkchop (3).png",
            "../../monsterhunter.png",
            "../../ironman.png",
            "../../yummyfish.png",
            "../../whenpigsfly.png",
            "../../dispsensewiththis.png",

            // Missing Items & Tools
            "../../ironingot.png",
            "../../gold_ingot.png",
            "../../diamond.png",
            "../../flint.png",
            "../../flint_and_steel.png",
            "../../feather.png",
            "../../bone.png",
            "../../bone_meal.png",
            "../../gunpowder.png",
            "../../heartfull.png",
            "../../hearthalffull.png",
            "../../heartempty.png",
            "../../foodfull.png",
            "../../foodhalffull.png",
            "../../foodempty.png",
            "../../brick.png",
            "../../clay_ball.png",
            "../../leather.png",
            "../../woodenpickaxe.png",
            "../../stone_pickaxe.png",
            "../../iron_pickaxe.png",
            "../../golden_pickaxe.png",
            "../../diamond_pickaxe.png",
            "../../woodensword.png",
            "../../stone_sword.png",
            "../../iron_sword.png",
            "../../golden_sword.png",
            "../../diamond_sword.png",
            "../../woodenshovel.png",
            "../../stone_shovel.png",
            "../../iron_shovel.png",
            "../../golden_shovel.png",
            "../../diamond_shovel.png",
            "../../wooden_axe.png",
            "../../stone_axe.png",
            "../../iron_axe.png",
            "../../golden_axe.png",
            "../../diamond_axe.png",
            "../../wooden_hoe.png",
            "../../stone_hoe.png",
            "../../iron_hoe.png",
            "../../golden_hoe.png",
            "../../diamond_hoe.png",
            "../../bowidle.png",
            "../../bowpull1.png",
            "../../bowpull2.png",
            "../../bowpull3.png",
            "../../stick.png",
            "../../sheer.png",
            "../../coal.png",
            "../../cowspawnegg.png",
            "../../chickenegg.png",
            "../../zombieegg.png",
            "../../creeper_spawn_egg.png",
            "../../snowzombiespawnegg.png.png",
            "../../huskspawnegg.png",
            "../../drownedspawnegg.png",
            "../../villager_spawn_egg.png",
            "../../pig_spawn_egg.png",
            "../../butcher.png",
            "../../farmer.png",
            "../../librarian.png",
            "../../priest.png",
            "../../smith.png",
            "../../skeleton_spawn_egg.png",
            "../../horse_spawn_egg.png",
            "../../furnace.png.png",
            "../../fire_1.png",
            "../../nether_portal.png",
            "../../farmland.png",
            "../../farmland_moist.png",
            "../../cut_sandstone.png",
            "../../chiseled_sandstone.png",
            "../../desert (3).png",

            // Missing Block Textures (Mineral/Special)
            "../../goldblock.png",
            "../../ironblock.png",
            "../../diamondblock.png",
            "../../gravel.png",
            "../../clay.png",
            "../../bricks.png",
            "../../smooth_stone.png",
            "../../stone_bricks.png",
            "../../paintingfront1by1.png",
            "../../1x1painting2.webp",
            "../../1x1painting3.png",
            "../../armorempty.png",
            "../../armorhalf.png",
            "../../armorfull.png",
            "../../paintingback.png",
            "../../grasslandfoliage.png",
            
            // Emeralds
            "../../emerald_ore.png",
            "../../emerald.png",
            "../../emerald_block.png",

            // Snow Biome Textures
            "../../snowygrassblocktop.png",
            "../../snowygrassblockside.png",
            "../../snow.png",
            "../../ice.png",
            "../../packedice.png",

            // Ensure apple, golden apple and oak sapling textures are loaded
            "../../wheat_seeds.png",
            "../../oaksapling.png",
            
            // Wheat Stages
            "../../wheat_stage0.png",
            "../../wheat_stage1.png",
            "../../wheat_stage2.png",
            "../../wheat_stage3.png",
            "../../wheat_stage4.png",
            "../../wheat_stage5.png",
            "../../wheat_stage6.png",
            "../../wheat_stage7.png",
            
            // Carrots
            "../../carrots_stage0.png",
            "../../carrots_stage1.png",
            "../../carrots_stage2.png",
            "../../carrots_stage3.png",
            
            // Potatoes
            "../../potatoes_stage0.png",
            "../../potatoes_stage1.png",
            "../../potatoes_stage2.png",
            "../../potatoes_stage3.png",
            
            // Wheat
            "../../wheat.png",
            "../../map_background.png", // Map background
            "../../redstone_dust_dot.png", // Redstone Dot
            "../../redstone_dust_line0.png", // Redstone Line
            "../../redstone_block.png",
            "../../redstone_ore.png",
            "../../redstone_lamp.png",
            "../../redstone_lamp_on.png",
            "../../boat_icon.png",
            "../../dark_oak_boat.png",
            "../../oak_boat.png",
            "../../boat_planks.png", // Added boat planks texture
            "../../goldarmor.png", // Added gold armor texture
            "../../goldarmor2.png", // Added gold armor layer 2 texture
            "../../iron_layer_1.png",
            "../../iron_layer_2.png",
            "../../diamond_layer_1.png",
            "../../diamond_layer_2.png",

            // NEW: Glowstone Dust
            "../../glowstone_dust.png",
            
            // NEW: Snowball
            "../../snowball.png",
            
            // NEW: Ender Pearl
            "../../ender_pearl (1).png",

            // Armor Icons
            "../../gold_helmet.png",
            "../../gold_chestplate.png",
            "../../gold_leggings.png",
            "../../gold_boots.png",
            "../../iron_helmet.png",
            "../../iron_chestplate.png",
            "../../iron_leggings.png",
            "../../iron_boots.png",
            "../../diamond_helmet.png",
            "../../diamond_chestplate.png",
            "../../diamond_leggings.png",
            "../../diamond_boots.png",
            
            // Sandstone
            "../../sandstoneside.png",
            "../../sandstone_top.png",
            "../../sandstone_bottom.png",
            
            // NEW: TNT Textures
            "../../tnt_bottom.png",
            "../../tnt_top.png",
            "../../tnt_side.png",
            
            // Bed
            "../../red_mushroom.png",
            "../../brown_mushroom.png",
            "../../rail.png",
            "../../curvedrail.png",
            "../../minecart.png",
            "../../mycelium_top.png",
            "../../mycelium_side.png",
            "../../mushroom_stem.png",
            "../../brown_mushroom_block.png",
            "../../red_mushroom_block.png",
            "../../granite.png",
            "../../diorite.png",
            "../../andesite.png",
            "../../worldthumbnail (6).png",
            "../../structure_block (2).png",
            "../../commandblock.png",
            "../../dispenser_front.png",
            "../../lever.png",
            "../../stonesheet.png",
            "../../trapdoorsheet.png",
            "../../hay_block_top.png",
            "../../hay_block_side.png",
            "../../oak_leaves.png",
            "../../birch_leaves.png",
            "../../horse_gray (1).png",
            "../../horse_brown (1).png",
            "../../horse_white (1).png",
            "../../horse_creamy (1).png",
            "../../horse_black (1).png",
            "../../horse_darkbrown (1).png",
            "../../horse_skeleton (1).png",
            "../../horse_zombie (2).png",
            "../../donkey (1).png",
            "../../mule (1).png",
            "../../newblocksset1.png",
            "../../techstuff.png"
        ];

        // Ensure bucket textures are available (empty + water)
        lazy.push("../../bucket.png");
        lazy.push("../../water_bucket.png");
        lazy.push("../../lava.png");
        lazy.push("../../lava_bucket.png");
        lazy.push("../../saddle.png");

        const resources = {};
        const placeholder = this.createPlaceholder();

        // Initialize all lazy resources with placeholder immediately
        for (const path of lazy) {
            resources[path] = placeholder;
        }

        // Load essential textures first (wait for them)
        await Promise.all(essential.map(async path => {
            resources[path] = await this.loadTexture(path);
        }));

        // Launch game immediately with essential resources
        this.minecraft = new Minecraft(canvasWrapperId, resources);
        this.minecraft.assetsLoading = true;
        
        // Use non-enumerable property to prevent external scripts (like PostHog) 
        // from attempting to deep-clone the complex Minecraft engine object.
        Object.defineProperty(window, 'app', {
            value: this.minecraft,
            enumerable: false,
            configurable: true,
            writable: true
        });

        // Load lazy textures in background. 
        // Throttled refresh to prevent GPU Driver Reset during massive texture uploads.
        let loadedCount = 0;
        const refreshThreshold = 40; // Increased threshold significantly to reduce GPU pressure
        
        const lazyPromises = lazy.map(async path => {
            const img = await this.loadTexture(path);
            
            if (window.app && window.app.originalResources) {
                window.app.originalResources[path] = img;
            }

            if (resources[path] === placeholder) {
                resources[path] = img;
            }

            loadedCount++;
            // Only trigger a full refresh if we are in a menu or a significant batch is done.
            // Full refreshes cause expensive re-tessellation and GPU uploads.
            if (loadedCount % refreshThreshold === 0 && window.app) {
                // If in-game, defer to next menu or end of load to prevent stutter/driver hang
                if (window.app.currentScreen !== null) {
                    window.app.refreshTextures(false);
                }
            }
        });

        Promise.all(lazyPromises).then(() => {
            if (window.app) {
                window.app.assetsLoading = false;
                window.app.refreshTextures(false);
            }
        });

        this.minecraft.screenRenderer.initialize();
        // this.minecraft.worldRenderer.initialize();

        // Launch game on canvas
    }
}

// Launch game
new Start().launch("canvas-container"); 