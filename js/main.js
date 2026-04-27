function renderWorld(blockY) {
    // Check multiple Y layers for the first non-empty terrain block
    for (let y = blockY; y >= blockY - 10; y--) {
        const block = getBlockAt(y); // Assuming this function retrieves the block at the given Y coordinate
        if (block !== null && block.isNotEmpty()) {
            // Render the block if it's not empty
            renderBlock(block, y);
            break; // Break once we find the first non-empty block
        }
    }
}