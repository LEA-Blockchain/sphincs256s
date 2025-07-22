// Copyright (c) 2025 LEA Chain
// This file is licensed under the MIT license.
// See the LICENSE file in the project root for more information.
#include <stddef.h>
#include <stdint.h>
#include <stdlea.h>

#include "api.h"
#include "params.h"
#include "randombytes.h"

LEA_EXPORT(keygen)
int keygen(uint8_t *pk, uint8_t *sk)
{
    unsigned char seed[CRYPTO_SEEDBYTES];
    randombytes(seed, CRYPTO_SEEDBYTES);
    return crypto_sign_seed_keypair(pk, sk, seed);
}

LEA_EXPORT(sign)
int sign(uint8_t *sig, const uint8_t *m, size_t mlen, const uint8_t *sk)
{
    size_t siglen_val;
    crypto_sign_signature(sig, &siglen_val, m, mlen, sk);
    return SPX_BYTES;
}

LEA_EXPORT(verify)
int verify(const uint8_t *sig, size_t sig_len, const uint8_t *m, size_t mlen, const uint8_t *pk)
{
    if (SPX_BYTES != sig_len)
        LEA_ABORT();
    int result = crypto_sign_verify(sig, SPX_BYTES, m, mlen, pk);
    return result;
}

// --- Exported Constants for Buffer Sizes ---
LEA_EXPORT(pk_bytes)
int pk_bytes()
{
    return SPX_PK_BYTES;
}

LEA_EXPORT(sk_bytes)
int sk_bytes()
{
    return SPX_SK_BYTES;
}

LEA_EXPORT(signature_bytes)
int signature_bytes()
{
    return SPX_BYTES;
}
