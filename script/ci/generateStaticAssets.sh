#!/bin/bash

# static assets live at public/static/
npm install && \
npm run carto-node && \
npm run build:static