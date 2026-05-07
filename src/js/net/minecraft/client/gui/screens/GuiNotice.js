import GuiScreen from "../GuiScreen.js";
import GuiButton from "../widgets/GuiButton.js";

export default class GuiNotice extends GuiScreen {

    constructor(nextScreen, customMessage = null) {
        super();
        this.nextScreen = nextScreen;
        this.timer = 0; 
        this.message = customMessage || [
            "This project is maintained by you all. I simply do",
            "not have the credits or runs to work on this project,",
            "if you have credits and want to help the projects",
            "development, check out the blog and tip if you can!"
        ];
    }

    init() {
        super.init();
        
        this.btnContinue = new GuiButton("Continue", this.width / 2 - 100, this.height - 40, 200, 20, () => {
            this.minecraft.displayScreen(this.nextScreen);
        });
        
        this.btnContinue.setEnabled(true);
        this.buttonList.push(this.btnContinue);
    }

    updateScreen() {
        super.updateScreen();
        if (this.timer > 0) {
            this.timer--;
            // Update button label with remaining seconds
            this.btnContinue.string = `Continue (${Math.ceil(this.timer / 20)}s)`;
            
            if (this.timer <= 0) {
                this.btnContinue.setEnabled(true);
                this.btnContinue.string = "Continue";
            }
        }
    }

    drawScreen(stack, mouseX, mouseY, partialTicks) {
        // Use standard dirt background for the notice
        this.drawDefaultBackground(stack);
        
        // Center the message lines vertically
        const lineHeight = 12;
        const totalHeight = this.message.length * lineHeight;
        // Shift up more to ensure the bottom lines aren't cut off on small screens
        const yStart = (this.height / 2) - (totalHeight / 2) - 25;

        for (let i = 0; i < this.message.length; i++) {
            this.drawCenteredString(stack, this.message[i], this.width / 2, yStart + i * lineHeight, 0xFFFFFF);
        }

        super.drawScreen(stack, mouseX, mouseY, partialTicks);
    }
}