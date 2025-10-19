/**
 * Tests for ESC/POS Commands Module
 */

const ESCPOSCommands = require('../www/js/modules/escpos-commands.js');

describe('ESCPOSCommands', () => {
    let escpos;

    beforeEach(() => {
        escpos = new ESCPOSCommands();
    });

    test('should create instance', () => {
        expect(escpos).toBeInstanceOf(ESCPOSCommands);
    });

    test('should have correct ESC/POS constants', () => {
        expect(escpos.ESC).toBe(0x1B);
        expect(escpos.GS).toBe(0x1D);
        expect(escpos.LF).toBe(0x0A);
        expect(escpos.FF).toBe(0x0C);
    });

    describe('openCashDrawer', () => {
        test('should generate standard drawer open command', () => {
            const command = escpos.openCashDrawer();
            expect(command).toBeInstanceOf(Uint8Array);
            expect(command.length).toBe(5);
            expect(command[0]).toBe(0x1B); // ESC
            expect(command[1]).toBe(0x70); // p
            expect(command[2]).toBe(0);    // pin 0
            expect(command[3]).toBe(25);   // on time
            expect(command[4]).toBe(250);  // off time
        });

        test('should generate command with custom parameters', () => {
            const command = escpos.openCashDrawer(1, 50, 100);
            expect(command[2]).toBe(1);    // pin 1
            expect(command[3]).toBe(50);   // on time
            expect(command[4]).toBe(100);  // off time
        });
    });

    describe('openCashDrawerAlt', () => {
        test('should generate alternative drawer command', () => {
            const command = escpos.openCashDrawerAlt();
            expect(command).toBeInstanceOf(Uint8Array);
            expect(Array.from(command)).toEqual([0x1B, 0x70, 0x00, 0x19, 0xFA]);
        });
    });

    describe('openCashDrawerEpson', () => {
        test('should generate Epson drawer command', () => {
            const command = escpos.openCashDrawerEpson();
            expect(command).toBeInstanceOf(Uint8Array);
            expect(Array.from(command)).toEqual([0x1B, 0x70, 0x00, 0x32, 0xFA]);
        });
    });

    describe('openCashDrawerStar', () => {
        test('should generate Star Micronics drawer command', () => {
            const command = escpos.openCashDrawerStar();
            expect(command).toBeInstanceOf(Uint8Array);
            expect(Array.from(command)).toEqual([0x07]); // BEL
        });
    });

    describe('getAllCommands', () => {
        test('should return array of all commands', () => {
            const commands = escpos.getAllCommands();
            expect(Array.isArray(commands)).toBe(true);
            expect(commands.length).toBe(4);
            commands.forEach(cmd => {
                expect(cmd).toHaveProperty('name');
                expect(cmd).toHaveProperty('command');
                expect(cmd.command).toBeInstanceOf(Uint8Array);
            });
        });
    });

    describe('toHexString', () => {
        test('should convert bytes to hex string', () => {
            const bytes = new Uint8Array([0x1B, 0x70, 0x00]);
            const hex = escpos.toHexString(bytes);
            expect(hex).toBe('0x1B 0x70 0x00');
        });

        test('should handle single byte', () => {
            const bytes = new Uint8Array([0xFF]);
            const hex = escpos.toHexString(bytes);
            expect(hex).toBe('0xFF');
        });
    });

    describe('initializePrinter', () => {
        test('should generate initialize command', () => {
            const command = escpos.initializePrinter();
            expect(command).toBeInstanceOf(Uint8Array);
            expect(Array.from(command)).toEqual([0x1B, 0x40]); // ESC @
        });
    });

    describe('checkDrawerStatus', () => {
        test('should generate status check command', () => {
            const command = escpos.checkDrawerStatus();
            expect(command).toBeInstanceOf(Uint8Array);
            expect(Array.from(command)).toEqual([0x1B, 0x75, 0x00]); // ESC u 0
        });
    });
});
