var Vis = require('../../../src/vis/vis');

describe('vis/vis', function () {
  it('.trackLoadingObject .untrackLoadingObject and .clearLoadingObjects should change the loading attribute', function () {
    this.vis = new Vis();
    var object = { id: 'id' };

    // 'loading' is false by default
    expect(this.vis.get('loading')).toEqual(false);

    this.vis.trackLoadingObject(object);

    // an object is being loaded so 'loading' is true
    expect(this.vis.get('loading')).toEqual(true);

    this.vis.untrackLoadingObject(object);

    // no objects are being loaded again so 'loading' is false
    expect(this.vis.get('loading')).toEqual(false);
  });
});
