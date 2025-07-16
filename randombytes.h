// Copyright (c) 2025 LEA Chain
// This file is licensed under the MIT license.
// See the LICENSE file in the project root for more information.

#ifndef SPX_RANDOMBYTES_H
#define SPX_RANDOMBYTES_H

#ifdef __lea__
#include <stdlea.h>
LEA_IMPORT(env, __lea_randombytes) void randombytes(unsigned char *x, unsigned long long xlen);
#else
extern void randombytes(unsigned char *x, unsigned long long xlen);
#endif

#endif
