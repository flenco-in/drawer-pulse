/**
 * USB Handler Module
 * Handles USB communication for Android devices with USB OTG support
 */

class USBHandler {
    constructor() {
        this.device = null;
        this.isConnected = false;
        this.interface = null;
        this.endpoint = null;
    }

    /**
     * Request USB device access
     * Uses WebUSB API (if available) or Cordova plugin
     * @returns {Promise}
     */
    requestDevice() {
        return new Promise((resolve, reject) => {
            // Check for WebUSB API support
            if (navigator.usb) {
                this.requestDeviceWebUSB()
                    .then(resolve)
                    .catch(reject);
            } else if (window.cordova && window.cordova.plugins && window.cordova.plugins.usb) {
                // Fallback to Cordova USB plugin if available
                this.requestDeviceCordova()
                    .then(resolve)
                    .catch(reject);
            } else {
                reject(new Error('USB support not available. Install cordova-plugin-usb or use WebUSB compatible browser'));
            }
        });
    }

    /**
     * Request device using WebUSB API
     */
    async requestDeviceWebUSB() {
        try {
            // Request any USB device - user will select from available devices
            // Common printer vendor IDs: Epson (0x04b8), Star (0x0519), Bixolon (0x1504)
            const filters = [
                { vendorId: 0x04b8 }, // Epson
                { vendorId: 0x0519 }, // Star Micronics
                { vendorId: 0x1504 }, // Bixolon
                { vendorId: 0x0dd4 }, // Custom
                { classCode: 0x07 }   // Printer class
            ];

            this.device = await navigator.usb.requestDevice({ filters });

            await this.device.open();

            // Select first configuration
            if (this.device.configuration === null) {
                await this.device.selectConfiguration(1);
            }

            // Find the first interface
            const interfaces = this.device.configuration.interfaces;
            this.interface = interfaces[0];

            await this.device.claimInterface(this.interface.interfaceNumber);

            // Find bulk OUT endpoint
            const endpoints = this.interface.alternate.endpoints;
            this.endpoint = endpoints.find(ep => ep.direction === 'out');

            if (!this.endpoint) {
                throw new Error('No OUT endpoint found');
            }

            this.isConnected = true;

            return {
                success: true,
                device: {
                    vendorId: this.device.vendorId,
                    productId: this.device.productId,
                    manufacturerName: this.device.manufacturerName,
                    productName: this.device.productName
                }
            };
        } catch (error) {
            throw new Error('Failed to connect USB device: ' + error.message);
        }
    }

    /**
     * Request device using Cordova USB plugin
     */
    requestDeviceCordova() {
        return new Promise((resolve, reject) => {
            const usb = window.cordova.plugins.usb;

            // Request permission and list devices
            usb.requestPermission(
                (device) => {
                    this.device = device;
                    this.isConnected = true;
                    resolve({
                        success: true,
                        device: {
                            vendorId: device.vendorId,
                            productId: device.productId,
                            deviceName: device.deviceName
                        }
                    });
                },
                (error) => {
                    reject(new Error('USB permission denied: ' + error));
                }
            );
        });
    }

    /**
     * Send data to USB device
     * @param {Uint8Array} data - Binary data to send
     * @returns {Promise}
     */
    send(data) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected || !this.device) {
                reject(new Error('USB device not connected'));
                return;
            }

            if (navigator.usb && this.endpoint) {
                // WebUSB transfer
                this.device.transferOut(this.endpoint.endpointNumber, data)
                    .then(result => {
                        if (result.status === 'ok') {
                            resolve({ bytesSent: result.bytesWritten });
                        } else {
                            reject(new Error('USB transfer failed: ' + result.status));
                        }
                    })
                    .catch(reject);
            } else if (window.cordova && window.cordova.plugins && window.cordova.plugins.usb) {
                // Cordova USB plugin transfer
                const usb = window.cordova.plugins.usb;
                usb.write(
                    Array.from(data),
                    () => resolve({ success: true }),
                    (error) => reject(new Error('USB write failed: ' + error))
                );
            } else {
                reject(new Error('No USB interface available'));
            }
        });
    }

    /**
     * Disconnect USB device
     */
    async disconnect() {
        if (this.device && navigator.usb) {
            try {
                if (this.interface) {
                    await this.device.releaseInterface(this.interface.interfaceNumber);
                }
                await this.device.close();
            } catch (error) {
                console.error('Error disconnecting USB:', error);
            }
        }

        this.device = null;
        this.isConnected = false;
        this.interface = null;
        this.endpoint = null;
    }

    /**
     * List all connected USB devices
     */
    async listDevices() {
        if (navigator.usb) {
            const devices = await navigator.usb.getDevices();
            return devices.map(device => ({
                vendorId: device.vendorId,
                productId: device.productId,
                manufacturerName: device.manufacturerName,
                productName: device.productName
            }));
        } else if (window.cordova && window.cordova.plugins && window.cordova.plugins.usb) {
            return new Promise((resolve, reject) => {
                window.cordova.plugins.usb.listDevices(
                    (devices) => resolve(devices),
                    (error) => reject(error)
                );
            });
        }
        return [];
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            device: this.device ? {
                vendorId: this.device.vendorId,
                productId: this.device.productId,
                name: this.device.productName || this.device.deviceName
            } : null
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = USBHandler;
}
