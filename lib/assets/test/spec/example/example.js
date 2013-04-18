var Util = {
  map: function(array, func) {
    var len = array.length;
    var results = new Array(len);

    for(var i = 0; i < len; i++) {
      results[i] = func(array[i]);
    }

    return results;
  },

  reduce: function(array, acc, func) {
    for (var i = 0, len = array.length; i < len; i++) {
      acc = func(acc, array[i]);
    }

    return acc;
  }
};
