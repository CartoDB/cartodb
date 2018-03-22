var Backbone = require('backbone');
var OverlaysView = require('../../../../src/geo/ui/overlays-view.js');
var Engine = require('../../../../src/engine');
var createEngine = require('../../fixtures/engine.fixture.js');

describe('src/geo/ui/overlays-view.js', function () {
  var mapModelMock = new Backbone.Model();
  var engineMock;

  beforeEach(function () {
    engineMock = createEngine();
    this.overlaysCollection = new Backbone.Collection([
      {
        type: 'zoom',
        order: 2,
        options: {
          display: true
        }
      },
      {
        type: 'search',
        order: 1,
        options: {
          display: false
        }
      },
      {
        type: 'loader',
        order: 5,
        options: {
          display: true
        }
      }
    ]);
    this.view = new OverlaysView({
      overlaysCollection: this.overlaysCollection,
      engine: engineMock,
      visView: new Backbone.View({
        model: new Backbone.Model({ showLimitErrors: false })
      }),
      mapModel: mapModelMock,
      mapView: new Backbone.View()
    });

    this.view.render();
  });

  it('should render existing overlays', function () {
    expect(this.view.$('.CDB-OverlayContainer').length).toEqual(1);

    // Some overlays are grouped together in a container
    expect(this.view.$('.CDB-OverlayContainer > .CDB-Zoom').length).toEqual(1);
    expect(this.view.$('.CDB-OverlayContainer > .CDB-Search').length).toEqual(1);

    // Some others are global
    expect(this.view.$('> .CDB-Loader').length).toEqual(1);
  });

  it('should only show overlays with a truthy display option', function () {
    expect(this.view.$('.CDB-OverlayContainer > .CDB-Zoom').length).toEqual(1);
    expect(this.view.$('.CDB-OverlayContainer > .CDB-Search').length).toEqual(1);
    expect(this.view.$('> .CDB-Loader').length).toEqual(1);
  });

  it('should re-render overlays when a new overlay is added', function () {
    this.overlaysCollection.add({ type: 'fullscreen' });

    expect(this.view.$('.CDB-OverlayContainer > .CDB-Zoom').length).toEqual(1);
    expect(this.view.$('.CDB-OverlayContainer > .CDB-Search').length).toEqual(1);
    expect(this.view.$('.CDB-OverlayContainer > .CDB-Fullscreen').length).toEqual(1);
    expect(this.view.$('> .CDB-Loader').length).toEqual(1);
  });

  it('should re-render overlays when an overlay is removed', function () {
    this.overlaysCollection.remove(this.overlaysCollection.at(0));

    expect(this.view.$('.CDB-OverlayContainer > .CDB-Zoom').length).toEqual(0);
    expect(this.view.$('.CDB-OverlayContainer > .CDB-Search').length).toEqual(1);
    expect(this.view.$('> .CDB-Loader').length).toEqual(1);
  });

  it('should handle unknown overlay types properly', function () {
    this.overlaysCollection.add({ type: 'unknown' });

    expect(this.view.$('.CDB-OverlayContainer > .CDB-Zoom').length).toEqual(1);
    expect(this.view.$('.CDB-OverlayContainer > .CDB-Search').length).toEqual(1);
    expect(this.view.$('> .CDB-Loader').length).toEqual(1);
  });

  it('should toggle the loader overlay', function () {
    var loaderOverlay = this.view.$('> .CDB-Loader');
    expect(loaderOverlay.hasClass('is-visible')).toBeFalsy();

    engineMock._eventEmmitter.trigger(Engine.Events.RELOAD_STARTED);
    expect(loaderOverlay.hasClass('is-visible')).toBeTruthy();

    engineMock._eventEmmitter.trigger(Engine.Events.RELOAD_SUCCESS);
    expect(loaderOverlay.hasClass('is-visible')).toBeFalsy();
  });

  describe('._initBinds', function () {
    it('should call ._addLimitsOverlay on mapModel error:limit', function () {
      spyOn(this.view, '_addLimitsOverlay');
      this.view._initBinds();
      this.view._mapModel.trigger('error:limit');
      expect(this.view._addLimitsOverlay).toHaveBeenCalled();
    });

    it('should call ._addTilesOverlay on mapModel error:limit', function () {
      spyOn(this.view, '_addTilesOverlay');
      this.view._initBinds();
      this.view._mapModel.trigger('error:tile');
      expect(this.view._addTilesOverlay).toHaveBeenCalled();
    });
  });

  describe('._areLimitsErrorsEnabled', function () {
    it('should return visModel showLimitErrors', function () {
      expect(this.view._areLimitsErrorsEnabled()).toBe(false);
      this.view._visView.model.set('showLimitErrors', true);
      expect(this.view._areLimitsErrorsEnabled()).toBe(true);
    });
  });

  describe('._hasLimitsOverlay', function () {
    it('should return true if overlaysCollection has a limits overlay', function () {
      expect(this.view._hasLimitsOverlay()).toBe(false);
      this.view._overlaysCollection.add({ type: 'limits' });
      expect(this.view._hasLimitsOverlay()).toBe(true);
    });
  });

  describe('._addLimitsOverlay', function () {
    describe('when visModel showLimitErrors is true', function () {
      beforeEach(function () {
        this.view._visView.model.set('showLimitErrors', true);
      });

      it('should call ._removeTilesOverlay', function () {
        spyOn(this.view, '_removeTilesOverlay');
        this.view._mapModel.trigger('error:limit');
        expect(this.view._removeTilesOverlay).toHaveBeenCalled();
      });

      it('should add the overlay to the collection', function () {
        spyOn(this.view._overlaysCollection, 'add');
        this.view._mapModel.trigger('error:limit');
        expect(this.view._overlaysCollection.add).toHaveBeenCalled();
      });

      it('should add only one overlay of type limit', function () {
        spyOn(this.view._overlaysCollection, 'add').and.callThrough();
        this.view._mapModel.trigger('error:limit');
        this.view._mapModel.trigger('error:limit');
        expect(this.view._overlaysCollection.add.calls.count()).toEqual(1);
      });
    });

    describe('when visModel showLimitErrors is false', function () {
      it('should not add the overlay to the collection', function () {
        spyOn(this.view._overlaysCollection, 'add');
        this.view._mapModel.trigger('error:limit');
        expect(this.view._overlaysCollection.add).not.toHaveBeenCalled();
      });
    });
  });

  describe('._addTilesOverlay', function () {
    it('should add the overlay to the collection', function () {
      spyOn(this.view._overlaysCollection, 'add');
      this.view._mapModel.trigger('error:tile');
      expect(this.view._overlaysCollection.add).toHaveBeenCalled();
    });

    it('should add only one overlay of type tile', function () {
      spyOn(this.view._overlaysCollection, 'add').and.callThrough();
      this.view._mapModel.trigger('error:tile');
      this.view._mapModel.trigger('error:tile');
      expect(this.view._overlaysCollection.add.calls.count()).toEqual(1);
    });

    it('should not add the overlay if there is a limits overlay', function () {
      this.view._overlaysCollection.add({ type: 'limits' });
      spyOn(this.view._overlaysCollection, 'add');
      this.view._mapModel.trigger('error:tile');
      expect(this.view._overlaysCollection.add).not.toHaveBeenCalled();
    });
  });

  describe('._removeLimitsOverlay', function () {
    it('should remove the limits overlay from the collection', function () {
      spyOn(this.view._overlaysCollection, 'remove').and.callThrough();
      expect(this.view._overlaysCollection.length).toEqual(3);

      this.view._overlaysCollection.add({ type: 'limits' });
      expect(this.view._overlaysCollection.length).toEqual(4);

      this.view._removeLimitsOverlay();
      expect(this.view._overlaysCollection.remove).toHaveBeenCalled();
      expect(this.view._overlaysCollection.length).toEqual(3);
    });
  });

  describe('._removeTilesOverlay', function () {
    it('should remove the tiles overlay from the collection', function () {
      spyOn(this.view._overlaysCollection, 'remove').and.callThrough();
      expect(this.view._overlaysCollection.length).toEqual(3);

      this.view._overlaysCollection.add({ type: 'tiles' });
      expect(this.view._overlaysCollection.length).toEqual(4);

      this.view._removeTilesOverlay();
      expect(this.view._overlaysCollection.remove).toHaveBeenCalled();
      expect(this.view._overlaysCollection.length).toEqual(3);
    });
  });
});
