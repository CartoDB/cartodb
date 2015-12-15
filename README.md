Deep-Insights.js
====================

## Development

In additional to the default `npm install`, one needs to do some custom setup
(until cartodb.js plays well with Node modules conventions):

1. Clone [cartodb.js](https://github.com/CartoDB/cartodb.js) and build the files there `npm build`
1. `npm install ../cartodb.js`  -or- `npm link ../cartodb.js`, where `../` is the path to the cloned cartodb.js from prev step
1. `grunt dev` to get started


After the last step [http://localhost:9002/](http://localhost:9002/) should open in a browser, where you can run tests, see styleguide and examples etc.
