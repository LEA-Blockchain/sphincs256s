# SPHINCS+-256s LEA-PKMI Module

This project provides a WebAssembly (WASM) module for the `SPHINCS+-256s` signature scheme, fully compliant with the LEA Public Key Module Interface (LEA-PKMI).

This module is based on the specification defined in **LIP-0011: LEA Public Key Module Interface (LEA-PKMI)**. It allows for seamless integration into any LEA-compliant host environment for performing cryptographic operations like key generation, signing, and verification.

## Interface

The module interacts with a host environment through a set of imported and exported functions, as specified by LEA-PKMI.

### Imports

The host environment must provide the following functions to the WASM module, typically within an `env` object during instantiation.

- `__lea_abort(line: i32)`
  - **Description**: Called by the WASM module when a fatal, unrecoverable error occurs. The `line` argument indicates the source code line number where the error happened.
  - **Host Action**: The host should treat this as a critical failure and terminate the execution environment.

- `__lea_randombytes(ptr: i32, len: i32)`
  - **Description**: Called by the WASM module when it requires cryptographically secure random data (e.g., for key generation).
  - **Host Action**: The host must write `len` bytes of random data into the module's linear memory starting at the address specified by `ptr`.

### Exports

The WASM module exports the following functions and memory for use by the host environment.

#### Memory

- `memory: WebAssembly.Memory`
  - **Description**: The raw linear memory of the WASM module. The host must use this to read and write data (e.g., keys, messages, signatures) at the pointers returned by the allocator.

#### Allocator Functions

- `__lea_malloc(size: i32): i32`
  - **Description**: Allocates a block of memory of a specified `size` within the WASM module's memory space.
  - **Returns**: A pointer (integer address) to the start of the allocated block.

- `__lea_allocator_reset()`
  - **Description**: Resets the module's internal memory allocator, invalidating all previously allocated pointers. This is useful for cleaning up memory after a series of operations without needing to deallocate each block individually.

#### Constant Functions

These functions return the required byte sizes for keys and signatures, allowing the host to allocate the correct amount of memory.

- `pk_bytes(): i32`
  - **Returns**: The size (in bytes) of a public key. For SPHINCS+-256s, this is 64.

- `sk_bytes(): i32`
  - **Returns**: The size (in bytes) of a secret key. For SPHINCS+-256s, this is 128.

- `signature_bytes(): i32`
  - **Returns**: The size (in bytes) of a signature. For SPHINCS+-256s, this is 29792.

#### Cryptographic Functions

These are the core functions of the module. They return `0` on success and a non-zero value on failure.

- `keygen(pk_ptr: i32, sk_ptr: i32): i32`
  - **Description**: Generates a new public/private key pair.
  - **Parameters**:
    - `pk_ptr`: A pointer to a memory block allocated for the public key.
    - `sk_ptr`: A pointer to a memory block allocated for the secret key.
  - **Action**: Writes the generated public and secret keys to their respective memory locations.

- `sign(sig_ptr: i32, msg_ptr: i32, msg_len: i32, sk_ptr: i32): i32`
  - **Description**: Creates a signature for a given message using a secret key.
  - **Parameters**:
    - `sig_ptr`: A pointer to an allocated block where the resulting signature will be written.
    - `msg_ptr`: A pointer to the message to be signed.
    - `msg_len`: The length of the message.
    - `sk_ptr`: A pointer to the secret key to use for signing.

- `verify(sig_ptr: i32, msg_ptr: i32, msg_len: i32, pk_ptr: i32): i32`
  - **Description**: Verifies that a signature is valid for a given message and public key.
  - **Parameters**:
    - `sig_ptr`: A pointer to the signature to be verified.
    - `msg_ptr`: A pointer to the original message.
    - `msg_len`: The length of the message.
    - `pk_ptr`: A pointer to the public key corresponding to the key that created the signature.
  - **Returns**: `0` if the signature is valid, non-zero otherwise.

## Example Workflow

The following shows a typical sequence for using a LEA-PKMI compliant module:

1.  **Initialization**: Instantiate the WASM module (e.g., `module.wasm`), providing the required `imports`.
2.  **Get Constants**: Call `pk_bytes()`, `sk_bytes()`, and `signature_bytes()` to determine buffer sizes.
3.  **Key Generation**:
    - Allocate memory for the public and secret keys using `__lea_malloc()`.
    - Call `keygen()` with the pointers to generate the key pair.
4.  **Signing**:
    - Prepare the message and write it to the WASM memory (e.g., after allocating space with `__lea_malloc()`).
    - Allocate memory for the signature.
    - Call `sign()` with pointers to the signature buffer, message, and secret key.
5.  **Verification**:
    - Call `verify()` with pointers to the signature, message, and public key.
    - Check the return value: `0` means the signature is valid.
6.  **Cleanup**: Call `__lea_allocator_reset()` to clear the WASM memory for the next set of operations.
