var fakePromise = function (object, functionName) {
  var resolveFn = null;
  var rejectFn = null;

  spyOn(object, functionName).and.callFake(function () {
    return new Promise(function (resolve, reject) {
      resolveFn = resolve;
      rejectFn = resolve;
    });
  });

  function resolve (value) {
    if (resolveFn) {
      resolveFn(value);
      resolveFn = null;
    } else {
      throw new Error('Tried to resolve a promise that has not been called.');
    }
  }

  function reject (value) {
    if (rejectFn) {
      rejectFn(value);
      rejectFn = null;
    } else {
      throw new Error('Tried to reject a promise that has not been called.');
    }
  }

  function hasBeenCalled () {
    return !!resolveFn || !!rejectFn;
  }

  return {
    resolve: resolve,
    reject: reject,
    hasBeenCalled: hasBeenCalled
  };
};

module.exports = fakePromise;
