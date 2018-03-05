var fakePromise = function (object, functionName) {
  var resolveFn = null;

  spyOn(object, functionName).and.callFake(function () {
    return new Promise(function (resolve, reject) {
      resolveFn = resolve;
    });
  });

  function resolve (value) {
    if (resolveFn) {
      resolveFn(value);
    }
  }

  return resolve;
};

module.exports = fakePromise;
