/**
 * Cash Drawer API
 * Unified API for opening cash drawers via USB, Network (WiFi/Ethernet)
 * Supports multiple ESC/POS protocols
 */

class CashDrawerAPI {
    constructor() {
        this.escpos = new ESCPOSCommands();
        this.usbHandler = new USBHandler();
        this.networkHandler = new NetworkHandler();
        this.currentConnection = null;
        this.connectionType = null; // 'usb' or 'network'
    }

    /**
     * Connect to cash drawer via USB
     * @returns {Promise}
     */
    async connectUSB() {
        try {
            const result = await this.usbHandler.requestDevice();
            this.currentConnection = this.usbHandler;
            this.connectionType = 'usb';
            return result;
        } catch (error) {
            throw new Error('USB connection failed: ' + error.message);
        }
    }

    /**
     * Connect to cash drawer via Network (WiFi/Ethernet)
     * @param {string} host - IP address of the printer/cash drawer
     * @param {number} port - Port number (default 9100)
     * @param {boolean} useTCP - Use raw TCP instead of HTTP (default false)
     * @returns {Promise}
     */
    async connectNetwork(host, port = 9100, useTCP = false) {
        try {
            let result;
            if (useTCP) {
                result = await this.networkHandler.connectTCP(host, port);
            } else {
                result = await this.networkHandler.connect(host, port);
            }
            this.currentConnection = this.networkHandler;
            this.connectionType = 'network';
            return result;
        } catch (error) {
            throw new Error('Network connection failed: ' + error.message);
        }
    }

    /**
     * Open the cash drawer
     * @param {string} protocol - Protocol to use: 'standard', 'epson', 'star', 'alt', or 'all' (tries all)
     * @returns {Promise}
     */
    async openDrawer(protocol = 'standard') {
        if (!this.currentConnection || !this.currentConnection.isConnected) {
            throw new Error('Not connected to any device. Call connectUSB() or connectNetwork() first.');
        }

        try {
            let command;

            switch (protocol.toLowerCase()) {
                case 'standard':
                    command = this.escpos.openCashDrawer();
                    break;
                case 'epson':
                    command = this.escpos.openCashDrawerEpson();
                    break;
                case 'star':
                    command = this.escpos.openCashDrawerStar();
                    break;
                case 'alt':
                case 'alternative':
                    command = this.escpos.openCashDrawerAlt();
                    break;
                case 'all':
                    // Try all protocols
                    return await this.openDrawerWithAllProtocols();
                default:
                    command = this.escpos.openCashDrawer();
            }

            console.log('Sending command:', this.escpos.toHexString(command));
            const result = await this.currentConnection.send(command);
            return { success: true, protocol, result };

        } catch (error) {
            throw new Error('Failed to open drawer: ' + error.message);
        }
    }

    /**
     * Try opening drawer with all supported protocols
     * Useful when protocol is unknown
     */
    async openDrawerWithAllProtocols() {
        const protocols = this.escpos.getAllCommands();
        const results = [];

        for (const protocol of protocols) {
            try {
                console.log(`Trying ${protocol.name}:`, this.escpos.toHexString(protocol.command));
                await this.currentConnection.send(protocol.command);
                results.push({ protocol: protocol.name, success: true });
                // Wait a bit between commands
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                results.push({ protocol: protocol.name, success: false, error: error.message });
            }
        }

        return { success: true, results };
    }

    /**
     * Disconnect from current device
     */
    async disconnect() {
        if (this.currentConnection) {
            await this.currentConnection.disconnect();
            this.currentConnection = null;
            this.connectionType = null;
        }
    }

    /**
     * Get current connection status
     */
    getStatus() {
        return {
            connectionType: this.connectionType,
            connected: this.currentConnection ? this.currentConnection.isConnected : false,
            details: this.currentConnection ? this.currentConnection.getStatus() : null
        };
    }

    /**
     * Scan network for devices
     * @param {string} baseIP - Base IP (e.g., "192.168.1")
     * @param {number} startRange - Start IP range (default 1)
     * @param {number} endRange - End IP range (default 254)
     * @param {number} port - Port to scan (default 9100)
     */
    async scanNetwork(baseIP, startRange = 1, endRange = 254, port = 9100) {
        return await this.networkHandler.scanNetwork(baseIP, startRange, endRange, port);
    }

    /**
     * List USB devices
     */
    async listUSBDevices() {
        return await this.usbHandler.listDevices();
    }

    /**
     * Test drawer with custom command
     * @param {Array<number>} commandBytes - Raw command bytes
     */
    async sendCustomCommand(commandBytes) {
        if (!this.currentConnection || !this.currentConnection.isConnected) {
            throw new Error('Not connected to any device');
        }

        const command = new Uint8Array(commandBytes);
        console.log('Sending custom command:', this.escpos.toHexString(command));
        return await this.currentConnection.send(command);
    }

    /**
     * Initialize printer (useful before sending commands)
     */
    async initializePrinter() {
        if (!this.currentConnection || !this.currentConnection.isConnected) {
            throw new Error('Not connected to any device');
        }

        const command = this.escpos.initializePrinter();
        return await this.currentConnection.send(command);
    }
}

// Make available globally for Cordova app
if (typeof window !== 'undefined') {
    window.CashDrawerAPI = CashDrawerAPI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CashDrawerAPI;
}
