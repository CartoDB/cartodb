Deep-Insights.js [![Build Status](http://travis-ci.org/CartoDB/deep-insights.js.png?branch=master)](http://travis-ci.org/CartoDB/deep-insights.js)
====================

## Intro

Depth Insights.js allows to create powerful dashboards using CartoDB

## Quickstart

Please, read the [quickstart](doc/quickstart.md) and the [API](doc/api.md)


## Develop

`yarn install` and then `grunt dev` to build dev dist files

After the last step [http://localhost:9002/](http://localhost:9002/) should open in a browser, where you can run tests, see styleguide and examples etc.

## release

1. be sure you have the right secrets.json
1. Modify the package.json version
1. execute `grunt release`
