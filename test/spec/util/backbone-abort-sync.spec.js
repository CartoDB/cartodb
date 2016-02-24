var Model = require('../../../src/core/model');
var BackboneAbortSync = require('../../../src/util/backbone-abort-sync');

describe('util/backbone-abort-sync', function () {
  beforeEach(function () {
    this.model = new Model();
    this.model.url = 'url';
    this.model.sync = BackboneAbortSync.bind(this.model);
  });

  it('should abort old ongoing request', function () {
    var oldXHR = jasmine.createSpyObj('XHR', ['abort', 'always']);
    this.model._xhr = oldXHR;
    this.model.fetch();
    expect(oldXHR.abort).toHaveBeenCalled();
  });
});
