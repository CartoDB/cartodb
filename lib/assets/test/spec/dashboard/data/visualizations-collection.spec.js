const Backbone = require('backbone');
const VisualizationsCollection = require('dashboard/data/visualizations-collection');

const configModel = require('fixtures/dashboard/config-model.fixture');

describe('dashboard/data/visualizations-collection', function () {
  let collection, visualization, url, checkPageSpy;

  beforeEach(function () {
    url = 'wadus.com';

    visualization = {
      id: 1337,
      url: () => url
    };

    checkPageSpy = spyOn(VisualizationsCollection.prototype, '_checkPage');

    collection = new VisualizationsCollection({
      visualization
    }, { configModel });
  });

  describe('._PREVIEW_TABLES_PER_PAGE', function () {
    it('returns the correct value', function () {
      expect(collection._PREVIEW_TABLES_PER_PAGE).toEqual(10);
    });
  });

  describe('._TABLES_PER_PAGE', function () {
    it('returns the correct value', function () {
      expect(collection._TABLES_PER_PAGE).toEqual(20);
    });
  });

  describe('._PREVIEW_ITEMS_PER_PAGE', function () {
    it('returns the correct value', function () {
      expect(collection._PREVIEW_ITEMS_PER_PAGE).toEqual(3);
    });
  });

  describe('._ITEMS_PER_PAGE', function () {
    it('returns the correct value', function () {
      expect(collection._ITEMS_PER_PAGE).toEqual(9);
    });
  });

  describe('.initialize', function () {
    it('calls _checkPage on reset', function () {
      collection.reset();

      expect(collection._checkPage).toHaveBeenCalled();
    });
  });

  describe('.model', function () {
    it('adds configModel when creating a model', function () {
      collection.add({
        rick: 'morty'
      });

      expect(collection.at(0)._configModel).toEqual(configModel);
    });
  });

  describe('.getTotalPages', function () {
    it('returns the total pages rounded based on total_entries and options.per_page', function () {
      collection.total_entries = 10;
      collection.options.set('per_page', 3);

      expect(collection.getTotalPages()).toBe(4);
    });
  });

  describe('._checkPage', function () {
    it('increases the page in options if is bigger than the total', function () {
      checkPageSpy.and.callThrough();
      spyOn(collection, 'getTotalPages').and.returnValue(10);

      collection.options.set({ page: 9 }, { silent: true });
      collection._checkPage();

      expect(collection.options.get('page')).toEqual(9);

      collection.options.set({ page: 15 }, { silent: true });
      collection._checkPage();

      expect(collection.options.get('page')).toEqual(11);
    });
  });

  describe('._createUrlOptions', function () {
    it('returns options.attributes as url params', function () {
      const urlParams = 'tag_name=&q=&page=1&type=derived&exclude_shared=false&per_page=9';

      expect(collection._createUrlOptions()).toEqual(urlParams);
    });
  });

  describe('.url', function () {
    it('returns the correct url', function () {
      const excpectedUrl = '/api/v1/viz?tag_name=&q=&page=1&type=derived&exclude_shared=false&per_page=9';

      expect(collection.url()).toEqual(excpectedUrl);
    });
  });

  describe('.remove', function () {
    beforeEach(function () {
      collection.add({ rick: 'morty' });
    });

    it('decreases the total_entries by one', function () {
      collection.total_entries = 5;

      collection.remove(collection.at(0));

      expect(collection.total_entries).toEqual(4);
    });

    it('calls parent remove', function () {
      spyOn(Backbone.Collection.prototype, 'remove');

      collection.remove(collection.at(0));

      expect(Backbone.Collection.prototype.remove).toHaveBeenCalled();
    });
  });

  describe('.parse', function () {
    let parsedData;

    beforeEach(function () {
      const response = {
        total_entries: 1,
        total_shared: 3,
        total_likes: 3,
        total_user_entries: 7,
        visualizations: [
          { id: 1337, name: 'Mr Meeseeks', bindMap: true }
        ]
      };

      parsedData = collection.parse(response);
    });

    it('sets response.total_entries to collection', function () {
      expect(collection.total_entries).toBe(1);
    });

    it('sets response.total_shared to collection', function () {
      expect(collection.total_shared).toBe(3);
    });

    it('sets response.total_likes to collection', function () {
      expect(collection.total_likes).toBe(3);
    });

    it('sets response.total_user_entries to collection', function () {
      expect(collection.total_user_entries).toBe(7);
    });

    it('changes bindMap to false', function () {
      expect(parsedData[0].bindMap).toBe(false);
    });
  });

  describe('.create', function () {
    it('calls prototype create', function () {
      spyOn(Backbone.Collection.prototype, 'create');

      collection.create({ mr: 'meeseeks' });

      expect(Backbone.Collection.prototype.create).toHaveBeenCalled();
    });
  });

  describe('.fetch', function () {
    it('calls prototype fetch', function () {
      spyOn(Backbone.Collection.prototype, 'fetch');

      collection.fetch();

      expect(Backbone.Collection.prototype.fetch).toHaveBeenCalled();
    });
  });
});
