CartoDB-Dashboard.js
====================

## Development

In additional to the default `npm install`, one needs to do some custom setup
(until cartodb.js plays well with Node modules conventions):

1. Clone [cartodb.js](https://github.com/CartoDB/cartodb.js) and build the files there `npm build`
1. `npm link dir/to/cartodb.js`
1. `ln -s ./node_modules/cartodb.js/dist vendor`

Visual style guide can been seen in [`themes/styleguide/``](themes/styleguide/)

Examples can been seen in [`examples/``](examples/)
