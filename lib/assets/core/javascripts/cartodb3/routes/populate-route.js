function matchArg (haystack, args) {
  var argMatch = haystack.match(/:(.+)/);
  if (argMatch === null) {
    throw new Error('Malformed argument: ' + haystack);
  }

  var argName = argMatch[1];
  var argValue = args[argName];

  if (argValue === undefined) {
    throw new Error('No value provided for argument: ' + argName);
  }

  return haystack.replace(':' + argName, argValue);
}

function findArg (haystack) {
  var argMatch = haystack.match(/:(.+)/);
  return argMatch === null ? null : argMatch[1];
}

module.exports = function (route, args) {
  var optionalMatch = route.match(/\(.+\)+/);
  var optionalArg = optionalMatch !== null ? optionalMatch[0] : null;
  var cleanRoute = optionalArg !== null ? route.replace(optionalArg, '') : route;

  // Return route without optional arguments if no args were provided
  if (!args) return cleanRoute;

  // Find out if there's an optional argument provided, and if so, turn it into a regular one
  if (optionalArg !== null) {
    // Replace ( and ) with nothing, need the g to apply throughout the string
    optionalArg = optionalArg.replace(/\(|\)/g, '');
    var optionalArgName = findArg(optionalArg);

    if (args[optionalArgName]) {
      // append the optional arg without parenthesis
      cleanRoute += optionalArg.replace(/\(|\)/g, '');
    }
  }

  return cleanRoute
    // Split all url arguments
    .split(/(:[^\/]+)/g)
    // replace all arguments with the provided value
    .map(function (fragment) {
      return fragment.indexOf(':') === 0 ? matchArg(fragment, args) : fragment;
    })
    // join them again
    .join('');
};
