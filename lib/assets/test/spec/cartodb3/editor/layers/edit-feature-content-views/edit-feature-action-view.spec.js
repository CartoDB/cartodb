var Backbone = require('backbone');
var EditFeatureActionView = require('../../../../../../javascripts/cartodb3/editor/layers/edit-feature-content-views/edit-feature-action-view');

describe('editor/layers/edit-feature-content-views/edit-feature-action-view', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      hasChanges: false
    });

    this.featureModel = new Backbone.Model({
      the_geom: '{"type":"LineString","coordinates":[[0,0],[0,1]]}',
      name: '',
      description: ''
    });

    this.view = new EditFeatureActionView({
      featureModel: this.featureModel,
      model: this.model
    });
    this.view.render();
  });

  it('should render properly', function () {
    expect(this.view.$el.find('.js-save').length).toBe(1);
  });

  it('button should be disabled by default', function () {
    expect(this.view.$el.html()).toContain('is-disabled');
  });

  it('should update model if feature changes', function () {
    expect(this.model.get('hasChanges')).toBe(false);
    this.featureModel.set('the_geom', '{"type":"LineString","coordinates":[[0,0],[1,1]]}');
    expect(this.model.get('hasChanges')).toBe(true);
  });

  describe('when is new', function () {
    beforeEach(function () {
      this.featureModel.isNew = function () { return true; };
    });

    it('button should be add', function () {
      expect(this.view.$el.html()).toContain('editor.edit-feature.add');
    });
  });

  describe('when feature already exists', function () {
    beforeEach(function () {
      this.featureModel.isNew = function () { return false; };

      this.view.render();
    });

    it('button should be save', function () {
      expect(this.view.$el.html()).toContain('editor.edit-feature.save');
    });
  });

  describe('save feature', function () {
    beforeEach(function () {
      spyOn(this.featureModel, 'save');
    });

    describe('when has no changes', function () {
      beforeEach(function () {
        this.view.$('.js-save').click();
      });

      it('button should be disabled', function () {
        expect(this.view.$el.html()).toContain('is-disabled');
      });
    });

    describe('when has changes', function () {
      beforeEach(function () {
        this.model.set('hasChanges', true);

        this.view.$('.js-save').click();
      });

      it('should save the feature model', function () {
        expect(this.featureModel.save).toHaveBeenCalled();
      });

      describe('when save succeeds', function () {
        beforeEach(function () {
          this.featureModel.save.calls.argsFor(0)[0].success();
        });

        it('should update changes', function () {
          expect(this.model.get('hasChanges')).toBe(false);
        });
      });

      describe('when save fails', function () {
        beforeEach(function () {
          this.featureModel.save.calls.argsFor(0)[0].error();
        });

        it('should not have changes', function () {
          expect(this.model.get('hasChanges')).toBe(true);
        });
      });
    });
  });

  it('should have no leaks', function () {
    expect(this.view).toHaveNoLeaks();
  });
});
