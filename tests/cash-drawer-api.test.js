/**
 * Tests for Cash Drawer API
 */

// Mock the handler modules
const ESCPOSCommands = require('../www/js/modules/escpos-commands.js');

// Create mock classes
class MockUSBHandler {
    constructor() {
        this.isConnected = false;
    }
    async requestDevice() {
        this.isConnected = true;
        return { success: true, device: { vendorId: 0x04b8, productId: 0x0e15 } };
    }
    async send(data) {
        return { bytesSent: data.length };
    }
    async disconnect() {
        this.isConnected = false;
    }
    getStatus() {
        return { connected: this.isConnected };
    }
    async listDevices() {
        return [];
    }
}

class MockNetworkHandler {
    constructor() {
        this.isConnected = false;
    }
    async connect(host, port) {
        this.isConnected = true;
        return { success: true, host, port };
    }
    async send(data) {
        return { success: true };
    }
    async disconnect() {
        this.isConnected = false;
    }
    getStatus() {
        return { connected: this.isConnected };
    }
    async scanNetwork() {
        return [{ ip: '192.168.1.100', port: 9100 }];
    }
}

// Mock CashDrawerAPI with injected dependencies
class CashDrawerAPI {
    constructor(usbHandler, networkHandler) {
        this.escpos = new ESCPOSCommands();
        this.usbHandler = usbHandler || new MockUSBHandler();
        this.networkHandler = networkHandler || new MockNetworkHandler();
        this.currentConnection = null;
        this.connectionType = null;
    }

    async connectUSB() {
        const result = await this.usbHandler.requestDevice();
        this.currentConnection = this.usbHandler;
        this.connectionType = 'usb';
        return result;
    }

    async connectNetwork(host, port = 9100) {
        const result = await this.networkHandler.connect(host, port);
        this.currentConnection = this.networkHandler;
        this.connectionType = 'network';
        return result;
    }

    async openDrawer(protocol = 'standard') {
        if (!this.currentConnection || !this.currentConnection.isConnected) {
            throw new Error('Not connected to any device. Call connectUSB() or connectNetwork() first.');
        }

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
                command = this.escpos.openCashDrawerAlt();
                break;
            case 'all':
                return await this.openDrawerWithAllProtocols();
            default:
                command = this.escpos.openCashDrawer();
        }

        const result = await this.currentConnection.send(command);
        return { success: true, protocol, result };
    }

    async openDrawerWithAllProtocols() {
        const protocols = this.escpos.getAllCommands();
        const results = [];

        for (const protocol of protocols) {
            try {
                await this.currentConnection.send(protocol.command);
                results.push({ protocol: protocol.name, success: true });
            } catch (error) {
                results.push({ protocol: protocol.name, success: false, error: error.message });
            }
        }

        return { success: true, results };
    }

    async disconnect() {
        if (this.currentConnection) {
            await this.currentConnection.disconnect();
            this.currentConnection = null;
            this.connectionType = null;
        }
    }

    getStatus() {
        return {
            connectionType: this.connectionType,
            connected: this.currentConnection ? this.currentConnection.isConnected : false,
            details: this.currentConnection ? this.currentConnection.getStatus() : null
        };
    }
}

describe('CashDrawerAPI', () => {
    let api;
    let mockUSB;
    let mockNetwork;

    beforeEach(() => {
        mockUSB = new MockUSBHandler();
        mockNetwork = new MockNetworkHandler();
        api = new CashDrawerAPI(mockUSB, mockNetwork);
    });

    test('should create instance', () => {
        expect(api).toBeInstanceOf(CashDrawerAPI);
        expect(api.escpos).toBeInstanceOf(ESCPOSCommands);
    });

    describe('USB Connection', () => {
        test('should connect via USB', async () => {
            const result = await api.connectUSB();
            expect(result.success).toBe(true);
            expect(api.connectionType).toBe('usb');
            expect(api.currentConnection).toBe(mockUSB);
        });

        test('should disconnect USB', async () => {
            await api.connectUSB();
            await api.disconnect();
            expect(api.connectionType).toBeNull();
            expect(api.currentConnection).toBeNull();
        });
    });

    describe('Network Connection', () => {
        test('should connect via network', async () => {
            const result = await api.connectNetwork('192.168.1.100', 9100);
            expect(result.success).toBe(true);
            expect(result.host).toBe('192.168.1.100');
            expect(result.port).toBe(9100);
            expect(api.connectionType).toBe('network');
        });

        test('should use default port', async () => {
            const result = await api.connectNetwork('192.168.1.100');
            expect(result.port).toBe(9100);
        });
    });

    describe('Open Drawer', () => {
        beforeEach(async () => {
            await api.connectNetwork('192.168.1.100');
        });

        test('should throw error if not connected', async () => {
            const disconnectedAPI = new CashDrawerAPI(mockUSB, mockNetwork);
            await expect(disconnectedAPI.openDrawer()).rejects.toThrow('Not connected');
        });

        test('should open drawer with standard protocol', async () => {
            const result = await api.openDrawer('standard');
            expect(result.success).toBe(true);
            expect(result.protocol).toBe('standard');
        });

        test('should open drawer with epson protocol', async () => {
            const result = await api.openDrawer('epson');
            expect(result.success).toBe(true);
            expect(result.protocol).toBe('epson');
        });

        test('should open drawer with star protocol', async () => {
            const result = await api.openDrawer('star');
            expect(result.success).toBe(true);
            expect(result.protocol).toBe('star');
        });

        test('should try all protocols', async () => {
            const result = await api.openDrawer('all');
            expect(result.success).toBe(true);
            expect(result.results).toHaveLength(4);
            result.results.forEach(r => {
                expect(r).toHaveProperty('protocol');
                expect(r).toHaveProperty('success');
            });
        });
    });

    describe('Status', () => {
        test('should return disconnected status initially', () => {
            const status = api.getStatus();
            expect(status.connected).toBe(false);
            expect(status.connectionType).toBeNull();
        });

        test('should return connected status after USB connection', async () => {
            await api.connectUSB();
            const status = api.getStatus();
            expect(status.connected).toBe(true);
            expect(status.connectionType).toBe('usb');
        });

        test('should return connected status after network connection', async () => {
            await api.connectNetwork('192.168.1.100');
            const status = api.getStatus();
            expect(status.connected).toBe(true);
            expect(status.connectionType).toBe('network');
        });
    });
});
