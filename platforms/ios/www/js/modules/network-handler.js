/**
 * Network Handler Module
 * Handles TCP/IP communication for WiFi and Ethernet connected cash drawers
 */

class NetworkHandler {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentHost = null;
        this.currentPort = null;
    }

    /**
     * Connect to network printer/cash drawer
     * @param {string} host - IP address of the device
     * @param {number} port - Port number (usually 9100 for ESC/POS)
     * @returns {Promise}
     */
    connect(host, port = 9100) {
        return new Promise((resolve, reject) => {
            try {
                // For Cordova, we'll use Chrome Sockets API or a plugin
                // This is a placeholder that will be implemented with cordova-plugin-chrome-apps-sockets-tcp
                // or a custom WebSocket bridge

                this.currentHost = host;
                this.currentPort = port;

                // Using fetch API for HTTP-based network printers
                // Some modern network printers support HTTP POST
                this.connectionType = 'http';
                this.baseUrl = `http://${host}:${port}`;

                // Test connection
                this.testConnection()
                    .then(() => {
                        this.isConnected = true;
                        resolve({ success: true, host, port });
                    })
                    .catch(reject);

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Connect using raw TCP socket (requires plugin)
     */
    connectTCP(host, port = 9100) {
        return new Promise((resolve, reject) => {
            // This requires cordova-plugin-chrome-apps-sockets-tcp or similar
            if (typeof chrome !== 'undefined' && chrome.sockets && chrome.sockets.tcp) {
                chrome.sockets.tcp.create({}, (createInfo) => {
                    const socketId = createInfo.socketId;

                    chrome.sockets.tcp.connect(socketId, host, port, (result) => {
                        if (result < 0) {
                            reject(new Error('Failed to connect to ' + host + ':' + port));
                        } else {
                            this.socket = socketId;
                            this.isConnected = true;
                            this.currentHost = host;
                            this.currentPort = port;
                            this.connectionType = 'tcp';
                            resolve({ success: true, socketId, host, port });
                        }
                    });
                });
            } else {
                reject(new Error('TCP sockets not available. Install cordova-plugin-chrome-apps-sockets-tcp'));
            }
        });
    }

    /**
     * Test connection to device - REAL validation
     */
    testConnection() {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.isConnected = false;
                reject(new Error('Connection timeout - device not responding'));
            }, 3000);

            // Try to send a test command to verify real connection
            const testUrl = `http://${this.currentHost}:${this.currentPort}`;

            fetch(testUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/octet-stream'
                },
                body: new Uint8Array([0x1B, 0x40]), // ESC @ (initialize)
                mode: 'no-cors',
                signal: AbortSignal.timeout(3000)
            })
            .then(() => {
                clearTimeout(timeout);
                // Send worked, connection is real
                resolve();
            })
            .catch((error) => {
                clearTimeout(timeout);
                this.isConnected = false;

                if (error.name === 'AbortError' || error.name === 'TimeoutError') {
                    reject(new Error('Device not responding - check IP and network'));
                } else {
                    reject(new Error('Cannot connect to device - verify IP address and port'));
                }
            });
        });
    }

    /**
     * Send data to network device
     * @param {Uint8Array} data - Binary data to send
     * @returns {Promise}
     */
    send(data) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Not connected to device'));
                return;
            }

            if (this.connectionType === 'tcp' && this.socket) {
                // Send via TCP socket
                chrome.sockets.tcp.send(this.socket, data.buffer, (sendInfo) => {
                    if (sendInfo.resultCode < 0) {
                        reject(new Error('Failed to send data'));
                    } else {
                        resolve({ bytesSent: sendInfo.bytesSent });
                    }
                });
            } else {
                // Send via HTTP POST
                fetch(`http://${this.currentHost}:${this.currentPort}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/octet-stream'
                    },
                    body: data,
                    mode: 'no-cors'
                })
                .then(() => resolve({ success: true }))
                .catch(reject);
            }
        });
    }

    /**
     * Disconnect from device
     */
    disconnect() {
        return new Promise((resolve) => {
            if (this.connectionType === 'tcp' && this.socket) {
                chrome.sockets.tcp.disconnect(this.socket, () => {
                    chrome.sockets.tcp.close(this.socket, () => {
                        this.socket = null;
                        this.isConnected = false;
                        resolve();
                    });
                });
            } else {
                this.isConnected = false;
                resolve();
            }
        });
    }

    /**
     * Scan network for devices (basic port scan)
     * @param {string} baseIP - Base IP address (e.g., "192.168.1")
     * @param {number} startRange - Start of IP range (e.g., 1)
     * @param {number} endRange - End of IP range (e.g., 254)
     * @param {number} port - Port to scan (default 9100)
     * @returns {Promise<Array>} - Array of found devices
     */
    async scanNetwork(baseIP, startRange = 1, endRange = 254, port = 9100) {
        const foundDevices = [];
        const promises = [];

        for (let i = startRange; i <= endRange; i++) {
            const ip = `${baseIP}.${i}`;

            const promise = new Promise((resolve) => {
                const timeout = setTimeout(() => resolve(null), 500);

                fetch(`http://${ip}:${port}`, {
                    method: 'HEAD',
                    mode: 'no-cors',
                    cache: 'no-cache'
                })
                .then(() => {
                    clearTimeout(timeout);
                    resolve(ip);
                })
                .catch(() => {
                    clearTimeout(timeout);
                    resolve(null);
                });
            });

            promises.push(promise);
        }

        const results = await Promise.all(promises);
        return results.filter(ip => ip !== null).map(ip => ({ ip, port }));
    }

    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.isConnected,
            host: this.currentHost,
            port: this.currentPort,
            type: this.connectionType
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetworkHandler;
}
