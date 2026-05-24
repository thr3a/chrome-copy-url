#!/bin/bash
for size in 16 48 128; do
  docker run --rm -v ./:/app -w /app thr3a/imagemagick convert input.png -resize "${size}x${size}^" -background none -gravity center -extent "${size}x${size}" "src/icons/icon-${size}.png"
done
