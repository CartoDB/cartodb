var Backbone = require('backbone');
var QueryRowModel = require('../../../../javascripts/cartodb3/data/query-row-model');

describe('data/query-row-model', function () {
  beforeEach(function () {
    this.configModel = new Backbone.Model();

    this.collection = new Backbone.Collection();
    this.collection._tableName = 'paco';
    this.collection._configModel = this.configModel;

    spyOn(QueryRowModel.prototype, '_onError').and.callThrough();
    this.model = new QueryRowModel({
      hey: 'how',
      hi: 'howdy'
    }, {
      collection: this.collection
    });
  });

  it('should have __id as idAttribute', function () {
    expect(this.model.idAttribute).toBe('__id');
  });

  describe('parse', function () {
    it('should add __id attribute if it is not present', function () {
      var attrs = this.model.parse(this.model.attributes);
      expect(attrs.__id).toBeDefined();
    });
  });

  describe('toJSON', function () {
    it('should not include __id', function () {
      var attrs = this.model.toJSON();
      expect(attrs.__id).not.toBeDefined();
    });
  });

  describe('url', function () {
    beforeEach(function () {
      this.configModel.set('base_url', '');
      this.configModel.urlVersion = function () { return 'v1'; };
    });

    it('should not provide a valid url if tableName is not defined', function () {
      this.model._tableName = '';
      expect(this.model.url()).toBeFalsy();
      this.model._tableName = 'paco';
      expect(this.model.url()).toBe('/api/v1/tables/paco/records');
    });
  });

  describe('save', function () {
    it('should set previous attributes if there is an error', function () {
      this.model.sync = function (a, b, opts) {
        opts.error();
      };

      this.model
        .set({ hey: 'ha' })
        .save();
      expect(QueryRowModel.prototype._onError).toHaveBeenCalled();
      expect(this.model.get('hey')).toBe('how');
    });
  });
});
