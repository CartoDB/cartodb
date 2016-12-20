var Backbone = require('backbone');
var OverlaysView = require('../../../../src/geo/ui/overlays-view.js');

describe('src/geo/ui/overlays-view.js', function () {
  beforeEach(function () {
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
    this.visModel = new Backbone.Model();
    this.visView = new Backbone.View();
    this.mapModel = new Backbone.Model();
    this.mapView = new Backbone.View();

    this.overlaysView = new OverlaysView({
      overlaysCollection: this.overlaysCollection,
      visModel: this.visModel,
      visView: this.visView,
      mapModel: this.mapModel,
      mapView: this.mapView
    });

    this.overlaysView.render();
  });

  it('should render existing overlays', function () {
    expect(this.overlaysView.$('.CDB-OverlayContainer').length).toEqual(1);

    // Some overlays are grouped together in a container
    expect(this.overlaysView.$('.CDB-OverlayContainer > .CDB-Zoom').length).toEqual(1);
    expect(this.overlaysView.$('.CDB-OverlayContainer > .CDB-Search').length).toEqual(1);

    // Some others are global
    expect(this.overlaysView.$('> .CDB-Loader').length).toEqual(1);
  });

  it('should only show overlays with a truthy display option', function () {
    expect(this.overlaysView.$('.CDB-OverlayContainer > .CDB-Zoom').length).toEqual(1);
    expect(this.overlaysView.$('.CDB-OverlayContainer > .CDB-Search').length).toEqual(1);
    expect(this.overlaysView.$('> .CDB-Loader').length).toEqual(1);
  });

  it('should re-render overlays when a new overlay is added', function () {
    this.overlaysCollection.add({
      type: 'fullscreen'
    });

    expect(this.overlaysView.$('.CDB-OverlayContainer > .CDB-Zoom').length).toEqual(1);
    expect(this.overlaysView.$('.CDB-OverlayContainer > .CDB-Search').length).toEqual(1);
    expect(this.overlaysView.$('.CDB-OverlayContainer > .CDB-Fullscreen').length).toEqual(1);
    expect(this.overlaysView.$('> .CDB-Loader').length).toEqual(1);
  });

  it('should re-render overlays when an overlay is removed', function () {
    this.overlaysCollection.remove(this.overlaysCollection.at(0));

    expect(this.overlaysView.$('.CDB-OverlayContainer > .CDB-Zoom').length).toEqual(0);
    expect(this.overlaysView.$('.CDB-OverlayContainer > .CDB-Search').length).toEqual(1);
    expect(this.overlaysView.$('> .CDB-Loader').length).toEqual(1);
  });

  it('should handle unknown overlay types properly', function () {
    this.overlaysCollection.add({
      type: 'unknown'
    });

    expect(this.overlaysView.$('.CDB-OverlayContainer > .CDB-Zoom').length).toEqual(1);
    expect(this.overlaysView.$('.CDB-OverlayContainer > .CDB-Search').length).toEqual(1);
    expect(this.overlaysView.$('> .CDB-Loader').length).toEqual(1);
  });

  it('should toggle the loader overlay', function () {
    var loaderOverlay = this.overlaysView.$('> .CDB-Loader');

    expect(loaderOverlay.hasClass('is-visible')).toBeFalsy();

    this.visModel.set('loading', true);

    expect(loaderOverlay.hasClass('is-visible')).toBeTruthy();

    this.visModel.set('loading', false);

    expect(loaderOverlay.hasClass('is-visible')).toBeFalsy();
  });
});
