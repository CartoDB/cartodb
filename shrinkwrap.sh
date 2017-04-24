#!/bin/bash

echo $PATH
nvm use 0.10
rm -rf npm-shrinkwrap.json
rm -rf node_modules && npm install --no-shrinkwrap && npm shrinkwrap
cp npm-shrinkwrap.json npm-shrinkwrap-010.json
nvm use 6.9.2
rm -rf npm-shrinkwrap.json
rm -rf node_modules
npm install --production --no-shrinkwrap && npm dedupe && npm prune && npm shrinkwrap && npm install
cp npm-shrinkwrap.json npm-shrinkwrap-69.json
