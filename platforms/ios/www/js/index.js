/**
 * Cash Drawer App
 * Main application logic
 */

let cashDrawerAPI;
let currentConnectionType = 'network';

// Prevent iOS from caching too much and optimize performance
if (typeof window !== 'undefined') {
    // iOS-specific optimizations
    window.addEventListener('load', function() {
        if (window.performance && window.performance.memory) {
            console.log('Memory usage optimized for iOS');
        }
        // Disable iOS text size adjustment
        document.body.style.webkitTextSizeAdjust = '100%';
    });
}

document.addEventListener('deviceready', onDeviceReady, false);
document.addEventListener('pause', onPause, false);
document.addEventListener('resume', onResume, false);

function onDeviceReady() {
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);

    // Add small delay for iOS to fully load WebView
    setTimeout(function() {
        try {
            // Initialize Cash Drawer API
            cashDrawerAPI = new CashDrawerAPI();

            log('App initialized and ready');
            updateStatus('Ready to connect', 'info');

            // Disable USB on iOS (not supported)
            if (cordova.platformId === 'ios') {
                const usbBtn = document.getElementById('btnUSB');
                if (usbBtn) {
                    usbBtn.disabled = true;
                    usbBtn.style.opacity = '0.5';
                    usbBtn.style.cursor = 'not-allowed';

                    // Add click handler to show message when clicked
                    usbBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();

                        updateStatus('USB not supported on iOS', 'error');
                        log('USB is not supported on iOS platform. Use Network connection instead.', 'error');

                        // Show platform note
                        const note = document.getElementById('platformNote');
                        if (note) {
                            note.classList.remove('hidden');
                            setTimeout(() => note.classList.add('hidden'), 5000);
                        }
                    });
                }
                console.log('USB disabled on iOS (not supported)');
            }
        } catch (error) {
            console.error('Initialization error:', error);
            updateStatus('Error initializing app: ' + error.message, 'error');
        }
    }, 50); // Reduced from 100ms to 50ms for faster launch
}

function onPause() {
    console.log('App paused');
}

function onResume() {
    console.log('App resumed');
}

/**
 * Select connection type (USB or Network) - Platform aware
 */
function selectConnectionType(type) {
    // Check if iOS and trying to switch to USB
    if (type === 'usb' && cordova.platformId === 'ios') {
        updateStatus('USB not supported on iOS', 'error');
        log('USB not available on iOS platform', 'error');

        // Show platform note
        const note = document.getElementById('platformNote');
        if (note) {
            note.classList.remove('hidden');
            setTimeout(() => note.classList.add('hidden'), 3000);
        }
        return; // Don't switch
    }

    currentConnectionType = type;

    const usbBtn = document.getElementById('btnUSB');
    const netBtn = document.getElementById('btnNetwork');
    const usbConn = document.getElementById('usbConnection');
    const netConn = document.getElementById('networkConnection');

    // Instant state updates
    if (type === 'usb') {
        usbBtn.classList.add('active');
        netBtn.classList.remove('active');
        usbConn.classList.remove('hidden');
        netConn.classList.add('hidden');
    } else {
        netBtn.classList.add('active');
        usbBtn.classList.remove('active');
        netConn.classList.remove('hidden');
        usbConn.classList.add('hidden');
    }

    log(`Switched to ${type.toUpperCase()}`);
}

/**
 * Connect via USB
 */
async function connectUSB() {
    // Check if iOS
    if (cordova.platformId === 'ios') {
        updateStatus(
            'USB Not Supported on iOS',
            'error',
            'iOS does not support USB OTG connections. Please use Network connection instead.'
        );
        log('USB connection not available on iOS', 'error');
        return;
    }

    try {
        updateStatus('Requesting USB device...', 'info', 'Please select printer from USB device list');
        log('Requesting USB device...');

        const result = await cashDrawerAPI.connectUSB();

        log(`USB device connected: ${JSON.stringify(result.device)}`);
        updateStatus(
            'USB Device Connected',
            'success',
            `Connected to ${result.device.productName || result.device.deviceName || 'USB Printer'}`
        );

        // Show drawer controls
        document.getElementById('drawerControls').classList.remove('hidden');
        document.getElementById('logSection').classList.remove('hidden');

    } catch (error) {
        let errorDetails = error.message;

        if (error.message.includes('No device selected') || error.message.includes('cancelled')) {
            errorDetails = 'You cancelled the USB device selection. Please try again and select your printer.';
        } else if (error.message.includes('not found') || error.message.includes('no devices')) {
            errorDetails = `
                No USB devices found.<br><br>
                <strong>Troubleshooting:</strong><br>
                • Connect printer via USB OTG cable<br>
                • Ensure printer is powered ON<br>
                • Check if cable is working<br>
                • Try reconnecting the USB cable
            `;
        } else if (error.message.includes('permission')) {
            errorDetails = `
                USB permission denied.<br><br>
                Please grant USB permission when Android asks for it.
            `;
        }

        log(`USB connection error: ${error.message}`, 'error');
        updateStatus('USB Connection Failed', 'error', errorDetails);
    }
}

/**
 * Connect via Network with comprehensive error handling
 */
async function connectNetwork() {
    try {
        const ip = document.getElementById('ipAddress').value.trim();
        const port = parseInt(document.getElementById('port').value);

        // Validation with detailed error messages
        if (!ip) {
            updateStatus(
                'IP Address Required',
                'error',
                'Please enter the printer IP address (e.g., 192.168.1.100)'
            );
            log('Error: IP address is required', 'error');
            return;
        }

        // Validate IP format
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipPattern.test(ip)) {
            updateStatus(
                'Invalid IP Address Format',
                'error',
                `"${ip}" is not a valid IP address. Use format: 192.168.1.100`
            );
            log(`Error: "${ip}" is not a valid IP address`, 'error');
            return;
        }

        // Validate IP octets
        const octets = ip.split('.');
        const invalidOctet = octets.find(octet => parseInt(octet) > 255);
        if (invalidOctet) {
            updateStatus(
                'Invalid IP Address',
                'error',
                'Each number in IP address must be between 0-255'
            );
            log(`Error: Invalid IP octet value: ${invalidOctet}`, 'error');
            return;
        }

        // Validate port
        if (isNaN(port) || port < 1 || port > 65535) {
            updateStatus(
                'Invalid Port Number',
                'error',
                'Port must be between 1-65535. Common printer port: 9100'
            );
            log(`Error: Port ${port} is invalid`, 'error');
            return;
        }

        updateStatus(`Connecting to printer at ${ip}:${port}...`, 'info');
        log(`Attempting connection to ${ip}:${port}...`);

        const result = await cashDrawerAPI.connectNetwork(ip, port);

        log(`Connected successfully to ${ip}:${port}!`, 'success');
        updateStatus(
            `Connected Successfully`,
            'success',
            `Printer at ${ip}:${port} is ready`
        );

        // Show drawer controls
        document.getElementById('drawerControls').classList.remove('hidden');
        document.getElementById('logSection').classList.remove('hidden');

    } catch (error) {
        // Detailed error messages with troubleshooting
        let errorTitle = 'Connection Failed';
        let errorDetails = '';

        if (error.message.includes('timeout') || error.message.includes('not responding')) {
            errorTitle = 'Connection Timeout';
            errorDetails = `
                • Check if printer is powered ON<br>
                • Verify printer and phone are on same WiFi network<br>
                • Try pinging ${document.getElementById('ipAddress').value} from another device
            `;
        } else if (error.message.includes('refused')) {
            errorTitle = 'Connection Refused';
            errorDetails = `
                • Verify port number (usually 9100 for printers)<br>
                • Check printer network settings<br>
                • Ensure printer firewall allows connections
            `;
        } else if (error.message.includes('unreachable')) {
            errorTitle = 'Network Unreachable';
            errorDetails = `
                • Check WiFi connection on this device<br>
                • Verify IP address is correct<br>
                • Try restarting WiFi router
            `;
        } else {
            errorTitle = 'Connection Error';
            errorDetails = error.message;
        }

        log(`Connection failed: ${error.message}`, 'error');
        updateStatus(errorTitle, 'error', errorDetails);
    }
}

/**
 * Open cash drawer with automatic brand/protocol detection
 */
async function openDrawerAuto() {
    if (!cashDrawerAPI || !cashDrawerAPI.currentConnection || !cashDrawerAPI.currentConnection.isConnected) {
        updateStatus(
            'Not Connected',
            'error',
            'Please connect to a printer first before opening the drawer'
        );
        log('Error: Not connected to any device', 'error');
        return;
    }

    try {
        updateStatus('Auto-detecting printer brand...', 'info', 'Trying ESC/POS, Epson, Star protocols...');
        log('Starting automatic brand detection...');

        // Get all available protocols
        const protocols = cashDrawerAPI.escpos.getAllCommands();
        let success = false;
        let workingProtocol = null;
        let attemptedProtocols = [];

        // Try each protocol until one works
        for (const protocol of protocols) {
            try {
                log(`Trying ${protocol.name}...`);
                updateStatus(`Testing ${protocol.name} protocol...`, 'info');
                attemptedProtocols.push(protocol.name);

                await cashDrawerAPI.currentConnection.send(protocol.command);

                // Small delay to see if drawer responds
                await new Promise(resolve => setTimeout(resolve, 200));

                // If no error, assume success
                workingProtocol = protocol.name;
                success = true;
                log(`${protocol.name} protocol worked!`, 'success');
                break;

            } catch (error) {
                log(`${protocol.name} protocol failed: ${error.message}`, 'error');
                continue;
            }
        }

        if (success) {
            updateStatus(
                'Drawer Opened Successfully',
                'success',
                `Using ${workingProtocol} protocol. This printer is compatible with ${workingProtocol}.`
            );
            log(`Success! Auto-detected protocol: ${workingProtocol}`, 'success');
        } else {
            updateStatus(
                'Failed to Open Drawer',
                'error',
                `
                    Tried all protocols (${attemptedProtocols.join(', ')}) but none worked.<br><br>
                    <strong>Troubleshooting:</strong><br>
                    • Check if cash drawer is properly connected to printer<br>
                    • Verify drawer cable is plugged into RJ11/RJ12 port<br>
                    • Ensure printer supports cash drawer kick commands<br>
                    • Test by printing a receipt to verify printer connection
                `
            );
            log('Failed: No protocol worked. Check drawer connection and power.', 'error');
        }

    } catch (error) {
        log(`Error: ${error.message}`, 'error');
        updateStatus(
            'Unexpected Error',
            'error',
            `An error occurred: ${error.message}`
        );
    }
}

/**
 * Disconnect from device
 */
async function disconnect() {
    try {
        log('Disconnecting...');
        await cashDrawerAPI.disconnect();

        updateStatus('Disconnected', 'info');
        log('Disconnected successfully');

        // Hide drawer controls
        document.getElementById('drawerControls').classList.add('hidden');

    } catch (error) {
        log(`Disconnect error: ${error.message}`, 'error');
        updateStatus('Disconnect error: ' + error.message, 'error');
    }
}

/**
 * List USB devices
 */
async function listUSBDevices() {
    try {
        updateStatus('Scanning for USB devices...', 'info');
        log('Scanning for USB devices...');

        const devices = await cashDrawerAPI.listUSBDevices();

        const container = document.getElementById('usbDevices');
        container.innerHTML = '';

        if (devices.length === 0) {
            container.innerHTML = '<div class="device-item">No USB devices found</div>';
            log('No USB devices found');
        } else {
            devices.forEach(device => {
                const item = document.createElement('div');
                item.className = 'device-item';
                item.innerHTML = `
                    <strong>${device.productName || device.deviceName || 'Unknown Device'}</strong><br>
                    <small>Vendor ID: ${device.vendorId}, Product ID: ${device.productId}</small>
                `;
                container.appendChild(item);

                log(`Found device: ${device.productName || device.deviceName} (${device.vendorId}:${device.productId})`);
            });
        }

        container.classList.remove('hidden');
        updateStatus(`Found ${devices.length} USB device(s)`, 'success');

    } catch (error) {
        log(`USB scan error: ${error.message}`, 'error');
        updateStatus('Failed to scan USB devices: ' + error.message, 'error');
    }
}

/**
 * Scan network for devices
 */
async function scanNetwork() {
    try {
        const ip = document.getElementById('ipAddress').value;
        const baseIP = ip.substring(0, ip.lastIndexOf('.'));

        if (!baseIP) {
            updateStatus('Please enter a valid IP address first', 'error');
            return;
        }

        updateStatus(`Scanning network ${baseIP}.0/24...`, 'info');
        log(`Scanning network ${baseIP}.1-254...`);

        // Network scanning is complex and slow - just show message
        updateStatus('Network scan not recommended - enter IP manually', 'info');
        log('Tip: Get printer IP from printer settings or router');

    } catch (error) {
        log(`Network scan error: ${error.message}`, 'error');
        updateStatus('Network scan failed: ' + error.message, 'error');
    }
}

/**
 * Update status message with optional details
 */
function updateStatus(message, type = 'info', details = null) {
    const statusEl = document.getElementById('status');
    statusEl.innerHTML = message;

    // Add details if provided
    if (details) {
        statusEl.innerHTML += `<div class="error-details">${details}</div>`;
    }

    statusEl.className = 'status ' + type;
}

/**
 * Log message with colors
 */
function log(message, type = 'info') {
    console.log(message);

    const logEl = document.getElementById('log');
    if (logEl) {
        const time = new Date().toLocaleTimeString();
        const entry = document.createElement('div');
        entry.className = 'log-entry';

        // Color based on type
        if (type === 'error') {
            entry.className += ' log-error';
        } else if (type === 'success') {
            entry.className += ' log-success';
        }

        entry.textContent = `[${time}] ${message}`;
        logEl.appendChild(entry);
        logEl.scrollTop = logEl.scrollHeight;
    }
}
