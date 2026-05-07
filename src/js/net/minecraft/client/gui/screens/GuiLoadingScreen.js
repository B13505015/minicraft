import GuiScreen from "../GuiScreen.js";

export default class GuiLoadingScreen extends GuiScreen {

    constructor() {
        super();
        this.isSaving = false;
    }

    init() {
        super.init();
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        // Check if we have an end background
        let bg = this.textureBackground;
        let scale = 2;
        if (this.title === "Entering Dimension..." || this.title === "Generating terrain...") {
            let endTex = this.minecraft.resources["../../endstuff.png"];
            if (endTex) {
                // If it's a dimension transition, use the swirling End texture (index 0)
                this.drawEndBackground(stack, endTex, this.width, this.height);
            } else {
                this.drawBackground(stack, bg, this.width, this.height, scale);
            }
        } else {
            this.drawBackground(stack, bg, this.width, this.height, scale);
        }

        // App Logo
        let logo = this.minecraft.resources["../../projectlogo.png"];
        if (logo) {
            const logoSize = 32;
            this.drawSprite(stack, logo, 0, 0, logo.width || 32, logo.height || 32, this.width / 2 - logoSize / 2, this.height / 2 - 60, logoSize, logoSize);
        }

        // Render title
        this.drawCenteredString(stack, this.title, this.width / 2, this.height / 2 - 20);

        if (!this.isSaving) {
            let progressWidth = 100;
            let progressHeight = 2;

            // Render background of progress
            this.drawRect(
                stack,
                this.width / 2 - progressWidth / 2,
                this.height / 2 - progressHeight / 2,
                this.width / 2 + progressWidth / 2,
                this.height / 2 + progressHeight / 2,
                '#808080',
            );

            // Render progress
            this.drawRect(
                stack,
                this.width / 2 - progressWidth / 2,
                this.height / 2 - progressHeight / 2,
                this.width / 2 - progressWidth / 2 + progressWidth * this.progress,
                this.height / 2 + progressHeight / 2,
                '#80ff80',
            );
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }

    drawEndBackground(stack, texture, width, height) {
        // Draw tiled end.png (Index 0 of endstuff.png)
        stack.save();
        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = 16; patternCanvas.height = 16;
        const pctx = patternCanvas.getContext('2d');
        pctx.drawImage(texture, 0, 0, 16, 16, 0, 0, 16, 16);
        const pattern = stack.createPattern(patternCanvas, "repeat");
        stack.scale(4, 4);
        stack.fillStyle = pattern;
        stack.fillRect(0, 0, width/4, height/4);
        stack.fillStyle = "rgba(0, 0, 0, 0.7)";
        stack.fillRect(0, 0, width/4, height/4);
        stack.restore();
    }

    setTitle(title) {
        this.title = title; // espera string em português também ("Gerando terreno...")
    }

    setProgress(progress) {
        if (this.isSaving) {
            // Always update progress for saving, even if it appears to go backwards (chunk processing may vary)
            this.progress = progress;
        } else {
            // For loading, only increase progress
            if (progress < this.progress) {
                return;
            }
            this.progress = progress;
        }
    }

    keyTyped(key) {
        // Cancel key inputs
    }
}