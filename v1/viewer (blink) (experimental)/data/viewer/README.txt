https://dl-cdn.alpinelinux.org/alpine/v3.18/main/x86_64/perl-5.36.1-r2.apk
https://exiftool.org/Image-ExifTool-12.69.tar.gz


# emscripten on docker

export CFLAGS=-O2

emconfigure ./configure
emmake make -j4

mkdir o//blink/blink-web
emcc -O2 o//blink/blink.o o//blink/blink.a -lm -pthread -lrt -o o//blink/blink-web/blink.html \
  --shell-file blink/blink-shell.html \
  -lworkerfs.js \
  -s INVOKE_RUN=0 \
  -s INITIAL_MEMORY=1073741824 \
  -s EXPORTED_RUNTIME_METHODS=callMain \
  -fno-builtin-exit \
  -sASSERTIONS \
  -sASYNCIFY
