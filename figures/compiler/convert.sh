#!/bin/bash
# Run after exported from Keynote.app
pdfcrop compiler.pdf
magick convert -density 300 compiler-crop.pdf compiler.png
