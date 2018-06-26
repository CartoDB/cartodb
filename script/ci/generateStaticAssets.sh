#!/bin/bash

# static assets live at public/static/
npm install --only=dev && \
npm run carto-node && \
npm run build:static