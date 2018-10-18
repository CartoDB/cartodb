const DatasetsCollection = require('dashboard/data/datasets-collection');

const configModel = require('fixtures/dashboard/config-model.fixture');

describe('data-library/data-library-view', function () {
  let collection;

  beforeEach(function () {
    collection = new DatasetsCollection(null, { configModel });
  });

  describe('.url', function () {
    it('creates the url properly', function () {
      const host = `rick.wadus.com`;
      const options = 'tag_name=&q=&page=1&type=derived&exclude_shared=false&per_page=12';

      expect(collection.url()).toEqual(`//${host}/api/v1/viz/?${options}`);
    });
  });
});
