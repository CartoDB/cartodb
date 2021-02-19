var Backbone = require('backbone');
var UserTablesModel = require('dashboard/data/user-tables-model');

describe('dashboard/data/user-tables-model', function () {
  var model;

  beforeEach(function () {
    spyOn(UserTablesModel.prototype, 'fetch');
    var userModel = new Backbone.Model({ base_url: 'http://wadus.com' });
    model = new UserTablesModel(null, { userModel: userModel });
  });

  it('throws an error when base_url is missing', function () {
    model = function () {
      return new UserTablesModel(null, {});
    };

    expect(model).toThrowError('userModel is required');
  });

  describe('._initBinds', function () {
    it('sets stateModel to fetched on sync', function () {
      expect(model.stateModel.get('status')).toEqual('fetching');

      model.trigger('sync');

      expect(model.stateModel.get('status')).toEqual('fetched');
    });

    it('sets stateModel to errored on error', function () {
      expect(model.stateModel.get('status')).toEqual('fetching');

      model.trigger('error');

      expect(model.stateModel.get('status')).toEqual('errored');
    });

    describe('when paramsModel change:q', function () {
      it('sets stateModel to fetching', function () {
        model.paramsModel.set({ q: 'wubalubadubdub' });

        expect(model.stateModel.get('status')).toEqual('fetching');
      });

      it('calls .fetch', function () {
        model.paramsModel.set({ q: 'wubalubadubdub' });

        expect(model.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('.url', function () {
    it('sets the default params in the url', function () {
      var defaultUrl = 'http://wadus.com/api/v1/viz?tag_name=&q=&page=1&type=&exclude_shared=true&tags=&shared=no&only_liked=false&order=updated_at&types=table&deepInsights=false&load_do_totals=true';
      expect(model.url()).toEqual(defaultUrl);
    });
  });

  describe('.generateParams', function () {
    it('returns the paramsModel attributes encoded', function () {
      var encodedParams = 'tag_name=&q=&page=1&type=&exclude_shared=true&tags=&shared=no&only_liked=false&order=updated_at&types=table&deepInsights=false&load_do_totals=true';
      expect(model.generateParams()).toEqual(encodedParams);
    });
  });

  describe('.parse', function () {
    it('transforms a tables array into an object', function () {
      var response = {
        visualizations: [
          { name: 'rick' },
          { name: 'morty' },
          { name: 'jerry' }
        ]
      };

      var values = model.parse(response);

      expect(values.rick).toBeDefined();
    });

    it('adds the default permissions to the table', function () {
      var response = {
        visualizations: [
          { name: 'jerry' }
        ]
      };

      var values = model.parse(response);

      expect(values.jerry.permissions).toEqual({
        select: false,
        update: false,
        insert: false,
        delete: false
      });
    });
  });

  describe('.setQuery', function () {
    it('sets the query in paramsModel', function () {
      expect(model.paramsModel.get('q')).toEqual('');

      model.setQuery('morty');

      expect(model.paramsModel.get('q')).toEqual('morty');
    });
  });

  describe('.getStateModel', function () {
    it('returns the stateModel', function () {
      expect(model.getStateModel()).toEqual(model.stateModel);
    });
  });

  describe('.isFetched', function () {
    it('returns true if stateModel:status is fetched', function () {
      model.stateModel.set({ status: 'fetched' });

      expect(model.isFetched()).toBe(true);
    });
  });

  describe('.hasQuery', function () {
    it('returns true if paramsModel has q', function () {
      expect(model.hasQuery()).toBe(false);

      model.paramsModel.set({ q: 'morty' });

      expect(model.hasQuery()).toBe(true);
    });
  });

  describe('.isEmpty', function () {
    it('returns true if model has no attributes', function () {
      expect(model.isEmpty()).toBe(true);

      model.set({ rick: 'morty' });

      expect(model.isEmpty()).toBe(false);
    });
  });
});
