# --- Configuration ---
ENABLE_UBSEN := 0
ENABLE_LEA_LOG := 0
ENABLE_LEA_FMT := 0

# --- Includes ---
include ../stdlea/stdlea.mk

# --- Compiler Flags ---
CFLAGS += -O3

# --- Include Paths ---
INCLUDE_PATHS := -I.

# --- Header Files ---
SPHINCS256S_HDRS = address.h context.h hash.h params.h rng.h sha2_offsets.h utils.h wots.h api.h fors.h merkle.h randombytes.h sha2.h thash.h utilsx1.h wotsx1.h
HDRS += $(SPHINCS256S)

# --- Source Files ---
SPHINCS256S_SRCS = sphincs256s.c address.c fors.c hash_sha2.c merkle.c sha2.c sign.c thash_sha2_robust.c utils.c utilsx1.c wots.c wotsx1.c
SRCS += $(SPHINCS256S_SRCS)

# --- Target ---
TARGET := sphincs256s.wasm

.PHONY: all clean test

all: $(TARGET)

$(TARGET): $(SRCS) $(HDRS)
	@echo "Compiling and linking sources to $(TARGET)..."
	$(CC) $(CFLAGS) $(INCLUDE_PATHS) \
	-Wl,--allow-undefined \
	$(SRCS) -o $@

	@echo "Stripping custom sections..."
	wasm-strip $@

clean:
	@echo "Removing build artifacts..."
	rm -f $(TARGET) *.o
