#!/bin/sh
# preview = con datos de Camilo; share = sin datos personales (arranca en el asistente)
# Salidas: build/novoy-web.zip (Netlify) y build/novoy-cloudflare.zip (Cloudflare Pages)
cd "$(dirname "$0")/.." && rm -rf build && mkdir -p build/preview build/share
cp -r site/* build/preview/ && [ -f private/seed-camilo.js ] && cp private/seed-camilo.js build/preview/seed.js || true
cp -r site/* build/share/ && SITE="${SITE_URL:-.}" && sed -i "s#__SITE__#$SITE#g" build/share/index.html build/preview/index.html
# Netlify: funciones en netlify/functions
cp -r netlify build/share/ && cp netlify.toml build/share/ && (cd build/share && zip -qr ../novoy-web.zip . -x 'cf/*')
# Cloudflare Pages: _worker.js en la raíz (sirve estáticos y /api/acct)
rm -rf build/cf && mkdir -p build/cf && cp -r site/* build/cf/ && sed -i "s#__SITE__#$SITE#g" build/cf/index.html
cp worker/_worker.js build/cf/ && (cd build/cf && zip -qr ../novoy-cloudflare.zip .)
