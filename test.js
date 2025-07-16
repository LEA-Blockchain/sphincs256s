const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto'); // Needed for random bytes

/**
 * A helper function to measure and log the execution time of an operation.
 * @param {string} label - A descriptive label for the operation being timed.
 * @param {Function} operation - The async function to execute and measure.
 * @returns {Promise<any>} - The result of the operation.
 */
async function timeLog(label, operation) {
    console.log(`\n[TIMELOG] Starting: ${label}...`);
    const startTime = process.hrtime.bigint();
    const result = await operation();
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1e6;
    console.log(`[TIMELOG] Finished: ${label}. Duration: ${durationMs.toFixed(3)} ms`);
    return result;
}


/**
 * A helper function to print a region of WASM memory as a hex string.
 * It will print a maximum of 128 bytes.
 * @param {WebAssembly.Memory} memory The WASM memory object.
 * @param {string} label A descriptive label for the memory region.
 * @param {number} ptr The pointer to the start of the data.
 * @param {number} len The total length of the data.
 */
function printWasmMemory(memory, label, ptr, len) {
    const MAX_PRINT_LEN = 128;
    const displayLen = Math.min(len, MAX_PRINT_LEN);

    const view = new Uint8Array(memory.buffer, ptr, displayLen);
    let hexString = Buffer.from(view).toString('hex');

    let lengthInfo = `Length: ${len} bytes`;

    if (len > MAX_PRINT_LEN) {
        lengthInfo += ` (displaying first ${MAX_PRINT_LEN} bytes)`;
        hexString += '...';
    }

    console.log(`\n--- Inspecting Memory: ${label} ---`);
    console.log(`Pointer: ${ptr}, ${lengthInfo}`);
    console.log(`Data (hex): ${hexString}`);
    console.log(`-------------------------------------------`);
}

async function main() {
    const wasmPath = process.argv[2];
    if (!wasmPath) {
        console.error('Error: Please provide the path to the .wasm file as an argument.');
        console.error('Usage: test.js <path/xxx.wasm>');
        process.exit(1);
    }
    console.log(`Loading WASM module from: ${wasmPath}`);


    let memory;

    const importObject = {
        env: {
            __lea_abort: (_line) => {
                const line = Number(_line);
                console.log(`[ABORT] at line ${line}\n`);
                process.exit(1);
            },

            __lea_log: (ptr, len) => {
                if (!memory) return;
                const _len = Number(len);
                const mem = new Uint8Array(memory.buffer, ptr, _len);
                const m = new TextDecoder('utf-8').decode(mem);
                (typeof process !== 'undefined' && process.stdout?.write)
                    ? process.stdout.write(`\x1b[38;5;208m${m}\x1b[0m`)
                    : console.log(`%c${m}`, 'color: orange');
            },

            __lea_randombytes: (ptr, len) => {
                console.log(`__lea_randombytes requested ${len} Bytes`);
                if (!memory) return;
                const _len = Number(len);
                const randomBytes = crypto.randomBytes(_len);
                const mem = new Uint8Array(memory.buffer, ptr, _len);
                mem.set(randomBytes);
            }
        },
    };

    const wasmBytes = await fs.readFile(wasmPath);
    const { instance } = await WebAssembly.instantiate(wasmBytes, importObject);

    // Get the memory from instance
    memory = instance.exports.memory;

    // Get exported functions
    const {
        keygen,
        sign,
        verify,
        pk_bytes,
        sk_bytes,
        signature_bytes,
        __lea_malloc,
        __lea_allocator_reset,
    } = instance.exports;

    console.log('WASM module loaded and instantiated.');

    const pkBytes = pk_bytes();
    const skBytes = sk_bytes();
    const sigBytes = signature_bytes();
    console.log(`\nPublic Key Bytes: ${pkBytes}`);
    console.log(`Secret Key Bytes: ${skBytes}`);
    console.log(`Signature Bytes: ${sigBytes}`);

    const pkPtr = __lea_malloc(pkBytes);
    const skPtr = __lea_malloc(skBytes);
    console.log(`\nAllocated memory for pk at ${pkPtr} and sk at ${skPtr}`);

    const keygenResult = await timeLog('Key Generation', () => keygen(pkPtr, skPtr));

    if (keygenResult !== 0) {
        console.error('Key generation failed.');
        return;
    }
    console.log('Keypair generated successfully.');


    printWasmMemory(memory, 'Public Key', pkPtr, pkBytes);
    printWasmMemory(memory, 'Secret Key', skPtr, skBytes);

    const message = Buffer.from('This is a test message.', 'utf8');
    const messageLen = message.length;
    const messagePtr = __lea_malloc(messageLen);
    new Uint8Array(memory.buffer, messagePtr, messageLen).set(message);
    console.log(`\nMessage to sign: "${message.toString()}"`);
    console.log(`Allocated memory for message at ${messagePtr}`);

    const sigPtr = __lea_malloc(sigBytes);
    console.log(`Allocated memory for signature at ${sigPtr}`);

    const signResult = await timeLog('Message Signing', () => sign(sigPtr, messagePtr, messageLen, skPtr));

    if (signResult !== 0) {
        console.error('Signing failed.');
        __lea_allocator_reset();
        return;
    }
    console.log('Message signed successfully.');


    printWasmMemory(memory, 'Signature', sigPtr, sigBytes);

    const verifyResult = await timeLog('Signature Verification', () => verify(sigPtr, messagePtr, messageLen, pkPtr));

    if (verifyResult !== 0) {
        console.error('Verification failed: Signature is NOT valid.');
        __lea_allocator_reset();
        return;
    }


    console.log('Success: Signature verified successfully.');

    __lea_allocator_reset();
    console.log('\nAllocator reset.');
}

main().catch(console.error);