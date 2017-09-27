/**
 * Load a vis.json from the scenarios folder
 * It returns a copy from the object to easy reusing.
 */
function load (index) {
  // We use a switch because our current build system doesn't support variables in the require.
  switch (index) {
    case 'basic':
      return clone(require('./basic_vis.json.js'));
  }
}

function clone (object) {
  return JSON.parse(JSON.stringify(object));
}

module.exports = {
  load: load
};
