var $ = require('jquery');
var cdb = require('cartodb.js');
var ChooseGeometryView = require('../../../../../../javascripts/cartodb/common/dialogs/georeference/choose_geometry_view');

describe('common/dialog/georeference/choose_geometry_view', function() {
  beforeEach(function() {
    this._fetchAvailableGeometriesOrg = ChooseGeometryView.prototype._fetchAvailableGeometries;
    spyOn(ChooseGeometryView.prototype, '_fetchAvailableGeometries');
    this.fetchData = {};
    this.model = new cdb.core.Model();
    this.view = new ChooseGeometryView({
      model: this.model,
      fetchData: this.fetchData
    });
    spyOn(this.view.availableGeometries, 'fetch');
    this.view.render();
  });

  it('should not have leaks', function() {
    expect(this.view).toHaveNoLeaks();
  });

  it('should render the loading screen', function() {
    expect(this.innerHTML()).toContain('Checking');
  });

  it('should fetch available geometries', function() {
    expect(ChooseGeometryView.prototype._fetchAvailableGeometries).toHaveBeenCalled();
  });

  describe('._fetchAvailableGeometries', function() {
    beforeEach(function() {
      // Makes it more convenient for testing different cases and assert its args
      this._fetchAvailableGeometries = function() {
        this._fetchAvailableGeometriesOrg.call(this.view);
        this.args = this.view.availableGeometries.fetch.calls.argsFor(0)[0];
      };
    });

    describe('when no specific fetchData is given', function() {
      beforeEach(function() {
        this._fetchAvailableGeometries();
      });

      it('should call fetch with anytype and World as free text', function() {
        expect(this.view.availableGeometries.fetch).toHaveBeenCalled();
        expect(this.args.data.kind).toEqual('anytype');
        expect(this.args.data.free_text).toEqual('World');
      });
    });

    describe('when model has a kind defined', function() {
      beforeEach(function() {
        this.model.kind = 'namedplace';
        this._fetchAvailableGeometries();
      });

      it('should use the kind given by model', function() {
        expect(this.args.data.kind).toEqual('namedplace');
      });
    });
  });

  describe('when available geometries are fetched', function() {
    beforeEach(function() {
      this.view.availableGeometries.set('available_geometries', ['point', 'polygon']);
    });

    it('should render the available geometries', function() {
      expect(this.innerHTML()).not.toContain('Checking');
      expect(this.innerHTML()).toContain('point');
      expect(this.innerHTML()).toContain('administrative region');
    });

    describe('when selected a geometry', function() {
      it('should set the selected geometry type on the model', function() {
        $(this.view.$('.OptionCard').first()).click();
        expect(this.model.get('geometryType')).toEqual('point');
        expect(this.view.$('.is-selected').length).toEqual(1);

        // test selecting the other too and that only one is selected at a time
        $(this.view.$('.OptionCard').last()).click();
        expect(this.model.get('geometryType')).toEqual('polygon');
        expect(this.view.$('.is-selected').length).toEqual(1);
      });
    });
  });

  afterEach(function() {
    this.view.clean();
  });
});
