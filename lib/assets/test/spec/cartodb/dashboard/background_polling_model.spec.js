var BackgroundPollingModel = require('../../../../javascripts/cartodb/dashboard/background_polling_model');
var ImportCollection = require('../../../../javascripts/cartodb/common/background_polling/models/imports_collection');

describe('dashboard/background_polling_model', function() {
  beforeEach(function() {
    this.user = new cdb.admin.User({
      username: 'pepe',
      base_url: 'http://pepe.cartodb.com'
    });
    this.importsCollection = new ImportCollection(undefined, {
      user: this.user
    });

    this.model = new BackgroundPollingModel({}, {
      user: this.user,
      importsCollection: this.importsCollection
    });
    spyOn(this.model, '_redirectTo');
  });

  describe('when an imports model has completed and all is good should redirect directly to the editor of its dataset', function() {
    beforeEach(function() {
      this.importsCollection.reset({});
      this.importsModel = this.importsCollection.at(0);
      this.url = new cdb.common.MapUrl({
        base_url: 'http://pepe.cartodb.com/viz/abc-123'
      });
      spyOn(cdb.admin.Visualization.prototype, 'viewUrl').and.returnValue(this.url);

      // "all is good" is defined like this, was extracted from background importer view at some point
      this.importsModel.imp.set({
        tables_created_count: 1,
        service_name: 'other',
        table_name: 'foobar'
      });
    });

    it('should redirect to vis that got imported if was completed, only one table was created, and the service name is not twitter search', function() {
      this.importsModel.set('state', 'complete');
      expect(this.model._redirectTo).toHaveBeenCalled();

      expect(this.model._redirectTo.calls.argsFor(0)[0]).toEqual('http://pepe.cartodb.com/viz/abc-123/map');
      expect(cdb.admin.Visualization.prototype.viewUrl).toHaveBeenCalledWith(this.user);
    });

    it('should not redirect if not complete yet', function() {
      this.importsModel.set('state', 'whatever');
      expect(this.model._redirectTo).not.toHaveBeenCalled();
    });

    it('should not redirect if there is no imported vis', function() {
      this.model.set('importLimit', 'whatever');
      expect(this.model._redirectTo).not.toHaveBeenCalled();
    });

    it('should not redirect if importLimit is set', function() {
      this.importsModel.imp.set('tablename', undefined);
      this.model.set('importLimit', 'whatever');
      expect(this.model._redirectTo).not.toHaveBeenCalled();
    });

    it('should not redirect if more than one table is created', function() {
      this.importsModel.imp.set('tables_created_count', 2);
      this.importsModel.set('state', 'complete');
      expect(this.model._redirectTo).not.toHaveBeenCalled();
    });

    it('should not redirect if service name is twitter search', function() {
      this.importsModel.imp.set('service_name', 'twitter_search');
      this.importsModel.set('state', 'complete');
      expect(this.model._redirectTo).not.toHaveBeenCalled();
    });
  });
});
