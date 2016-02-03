var cdb = require('cartodb.js-v3');
var Backbone = require('backbone-cdb-v3');
var StepsView = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/steps_view');
var RowModel = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/row_model');

describe('common/dialog/georeference/steps_view', function() {
  beforeEach(function() {
    this.rows = new Backbone.Collection([
      new RowModel({
        label: 'Test label'
      })
    ]);
    this.model = new cdb.core.Model({
      rows: this.rows
    });
    this.model.availableGeometriesFetchData = jasmine.createSpy('availableGeometriesFetchData');
    this.view = new StepsView({
      title: 'my title',
      desc: 'my desc',
      model: this.model
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the rows', function() {
    expect(this.innerHTML()).toContain('input');
    expect(this.innerHTML()).toContain('Test label');
  });

  it('should render title and desc', function() {
    expect(this.innerHTML()).toContain('my title');
    expect(this.innerHTML()).toContain('my desc');
  });

  describe('when changing step', function() {
    beforeEach(function() {
      this.model.set('step', 1);
    });

    it('should render view to choose geometry method', function() {
      expect(this.innerHTML()).toContain('available geometries');
      expect(this.innerHTML()).not.toContain('the title');
    });

    it('should not render title and desc', function() {
      expect(this.innerHTML()).not.toContain('my title');
      expect(this.innerHTML()).not.toContain('my desc');
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
