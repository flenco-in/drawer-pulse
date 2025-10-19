/**
 * ESC/POS Commands Module
 * Handles ESC/POS protocol commands for cash drawer control
 */

class ESCPOSCommands {
    constructor() {
        // ESC/POS command bytes
        this.ESC = 0x1B;
        this.GS = 0x1D;
        this.LF = 0x0A;
        this.FF = 0x0C;
    }

    /**
     * Generate cash drawer open command (Pulse)
     * ESC p m t1 t2
     * m = pin number (0 or 1)
     * t1 = ON time (milliseconds = t1 * 2)
     * t2 = OFF time (milliseconds = t2 * 2)
     *
     * Standard: ESC p 0 25 250 (pin 2, 50ms on, 500ms off)
     * Alternative: ESC p 1 25 250 (pin 5, 50ms on, 500ms off)
     */
    openCashDrawer(pin = 0, onTime = 25, offTime = 250) {
        return new Uint8Array([
            this.ESC, 0x70, pin, onTime, offTime
        ]);
    }

    /**
     * Alternative cash drawer open command
     * Some printers use: 1B 70 00 19 FA
     */
    openCashDrawerAlt() {
        return new Uint8Array([
            0x1B, 0x70, 0x00, 0x19, 0xFA
        ]);
    }

    /**
     * Star Micronics cash drawer command
     * Used by Star TSP series printers
     */
    openCashDrawerStar() {
        return new Uint8Array([
            0x07  // BEL command
        ]);
    }

    /**
     * Epson specific command
     */
    openCashDrawerEpson() {
        return new Uint8Array([
            0x1B, 0x70, 0x00, 0x32, 0xFA
        ]);
    }

    /**
     * Get all supported commands for trying multiple protocols
     */
    getAllCommands() {
        return [
            { name: 'Standard ESC/POS', command: this.openCashDrawer() },
            { name: 'Alternative ESC/POS', command: this.openCashDrawerAlt() },
            { name: 'Epson', command: this.openCashDrawerEpson() },
            { name: 'Star Micronics', command: this.openCashDrawerStar() }
        ];
    }

    /**
     * Convert Uint8Array to hex string for debugging
     */
    toHexString(bytes) {
        return Array.from(bytes)
            .map(b => '0x' + b.toString(16).toUpperCase().padStart(2, '0'))
            .join(' ');
    }

    /**
     * Initialize printer command
     */
    initializePrinter() {
        return new Uint8Array([this.ESC, 0x40]);
    }

    /**
     * Check drawer status (if supported by printer)
     */
    checkDrawerStatus() {
        return new Uint8Array([this.ESC, 0x75, 0x00]);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ESCPOSCommands;
}
