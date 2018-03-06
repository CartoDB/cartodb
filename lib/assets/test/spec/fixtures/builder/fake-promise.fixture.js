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
    }
  }

  function reject (value) {
    if (rejectFn) {
      rejectFn(value);
    }
  }

  function hasBeenCalled () {
    return object[functionName].calls.any();
  }

  return {
    resolve: resolve,
    reject: reject,
    hasBeenCalled: hasBeenCalled
  };
};

module.exports = fakePromise;
