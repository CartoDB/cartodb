var cdb = require('cartodb.js');
var Backbone = require('backbone');
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
    this.model.TITLE = 'the title';
    this.model.DESC = 'describing what this type does';
    this.model.availableGeometriesFetchData = jasmine.createSpy('availableGeometriesFetchData');
    this.view = new StepsView({
      model: this.model
    });
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render title and desc', function() {
    expect(this.innerHTML()).toContain('the title');
    expect(this.innerHTML()).toContain('describing what this type does');
  });

  it('should render the rows', function() {
    expect(this.innerHTML()).toContain('input');
    expect(this.innerHTML()).toContain('Test label');
  });

  describe('when changing step', function() {
    beforeEach(function() {
      this.model.set('step', 1);
    });

    it('should render view to choose geometry method', function() {
      expect(this.innerHTML()).toContain('available geometries');
      expect(this.innerHTML()).not.toContain('the title');
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
