#ifndef SPX_PARAMS_H
#define SPX_PARAMS_H
/* SPHINCS+-256s */

#define SPX_NAMESPACE(s) SPX_##s

/* Hash output length in bytes. */
#define SPX_N 32
/* Height of the hypertree. */
#define SPX_FULL_HEIGHT 64
/* Number of subtree layer. */
#define SPX_D 8
/* FORS tree dimensions. */
#define SPX_FORS_HEIGHT 14
#define SPX_FORS_TREES 22
/* Winternitz parameter, */
#define SPX_WOTS_W 16

/* The hash function is defined by linking a different hash.c file, as opposed
   to setting a #define constant. */

/* This is a SHA2-based parameter set, hence whether we use SHA-256
 * exclusively or we use both SHA-256 and SHA-512 is controlled by
 * the following #define */
#define SPX_SHA512 1  /* Use SHA-512 for H and T_l, l >= 2 */

/* For clarity */
#define SPX_ADDR_BYTES 32

/* WOTS parameters. */
#if SPX_WOTS_W == 256
    #define SPX_WOTS_LOGW 8
#elif SPX_WOTS_W == 16
    #define SPX_WOTS_LOGW 4
#else
    #error SPX_WOTS_W assumed 16 or 256
#endif

#define SPX_WOTS_LEN1 (8 * SPX_N / SPX_WOTS_LOGW)

/* SPX_WOTS_LEN2 is floor(log(len_1 * (w - 1)) / log(w)) + 1; we precompute */
#if SPX_WOTS_W == 256
    #if SPX_N <= 1
        #define SPX_WOTS_LEN2 1
    #elif SPX_N <= 256
        #define SPX_WOTS_LEN2 2
    #else
        #error Did not precompute SPX_WOTS_LEN2 for n outside {2, .., 256}
    #endif
#elif SPX_WOTS_W == 16
    #if SPX_N <= 8
        #define SPX_WOTS_LEN2 2
    #elif SPX_N <= 136
        #define SPX_WOTS_LEN2 3
    #elif SPX_N <= 256
        #define SPX_WOTS_LEN2 4
    #else
        #error Did not precompute SPX_WOTS_LEN2 for n outside {2, .., 256}
    #endif
#endif

#define SPX_WOTS_LEN (SPX_WOTS_LEN1 + SPX_WOTS_LEN2)
#define SPX_WOTS_BYTES (SPX_WOTS_LEN * SPX_N)
#define SPX_WOTS_PK_BYTES SPX_WOTS_BYTES

/* Subtree size. */
#define SPX_TREE_HEIGHT (SPX_FULL_HEIGHT / SPX_D)

#if SPX_TREE_HEIGHT * SPX_D != SPX_FULL_HEIGHT
    #error SPX_D should always divide SPX_FULL_HEIGHT
#endif

/* FORS parameters. */
#define SPX_FORS_MSG_BYTES ((SPX_FORS_HEIGHT * SPX_FORS_TREES + 7) / 8)
#define SPX_FORS_BYTES ((SPX_FORS_HEIGHT + 1) * SPX_FORS_TREES * SPX_N)
#define SPX_FORS_PK_BYTES SPX_N

/* Resulting SPX sizes. */
#define SPX_BYTES (SPX_N + SPX_FORS_BYTES + SPX_D * SPX_WOTS_BYTES +\
                   SPX_FULL_HEIGHT * SPX_N)
#define SPX_PK_BYTES (2 * SPX_N)
#define SPX_SK_BYTES (2 * SPX_N + SPX_PK_BYTES)

#include "sha2_offsets.h"

#endif
