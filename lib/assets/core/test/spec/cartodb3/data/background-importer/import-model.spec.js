var ConfigModel = require('../../../../../javascripts/cartodb3/data/config-model');
var ImportModel = require('../../../../../javascripts/cartodb3/data/background-importer/import-model.js');

describe('common/background-polling/import-model', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.model = new ImportModel(null, {
      configModel: this.configModel
    });
    spyOn(this.model, 'bind').and.callThrough();
  });

  it('should generate the right URL', function () {
    expect(this.model.url()).toBe('/u/pepe/api/v1/imports');
  });

  it('should have several change binds', function () {
    this.model._initBinds();
    var args_0 = this.model.bind.calls.argsFor(0);
    expect(args_0[0]).toEqual('change:item_queue_id');
  });

  it('should create a sync import when interval is greater than 0', function () {
    spyOn(this.model, '_createSyncImport');
    spyOn(this.model, '_createRegularImport');
    this.model.createImport({ interval: 10 });
    expect(this.model._createSyncImport).toHaveBeenCalled();
    expect(this.model._createRegularImport).not.toHaveBeenCalled();
  });

  it('should create a sync import when there\'s no interval', function () {
    spyOn(this.model, '_createSyncImport');
    spyOn(this.model, '_createRegularImport');
    this.model.createImport({ interval: null });
    expect(this.model._createSyncImport).toHaveBeenCalled();
    expect(this.model._createRegularImport).not.toHaveBeenCalled();
  });

  it('should create a regular import when interval is 0', function () {
    spyOn(this.model, '_createSyncImport');
    spyOn(this.model, '_createRegularImport');
    this.model.createImport({ interval: 0 });
    expect(this.model._createRegularImport).toHaveBeenCalled();
    expect(this.model._createSyncImport).not.toHaveBeenCalled();
  });

  it('should stop polling when import post fails', function () {
    this.model.sync = function (type, mdl, opts) {
      opts.error();
    };
    spyOn(this.model, 'pollCheck');
    this.model.createImport({ interval: 0 });
    expect(this.model.get('state')).toBe('failure');
    expect(this.model.pollCheck).not.toHaveBeenCalled();
  });

  it('should start polling when item_queue_id is set', function () {
    spyOn(this.model, 'pollCheck');
    this.model.set('item_queue_id', 'vamos-neno');
    expect(this.model.pollCheck).toHaveBeenCalled();
  });
});
