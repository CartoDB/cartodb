var Backbone = require('backbone');
var LegendViewBase = require('../../../../../../src/geo/ui/legends/base/legend-view-base.js');
var LegendModelBase = require('../../../../../../src/geo/map/legends/legend-model-base.js');

var MyLegendModel = LegendModelBase.extend({
  TYPE: 'something',

  isAvailable: function () {
    return true;
  }
});

var MyLegendView = LegendViewBase.extend({
  _getCompiledTemplate: function () {
    return '<h1>It Works!</h1>';
  }
});

describe('geo/ui/legends/legend-view-base.js', function () {
  beforeEach(function () {
    this.visModel = new Backbone.Model();
    this.model = new MyLegendModel({
      title: 'My Beautiful Legend',
      preHTMLSnippet: '<p>before</p>',
      postHTMLSnippet: '<p>after</p>',
      visible: true
    }, {
      visModel: this.visModel
    });

    this.myLegend = new MyLegendView({
      model: this.model,
      placeholderTemplate: function () {
        return '<p>Placeholder</p>';
      }
    });
  });

  describe('if model is loading', function () {
    beforeEach(function () {
      this.model.set('state', 'loading');
      this.myLegend.render();
    });

    it('should mark legend as loading', function () {
      expect(this.myLegend.$el.hasClass('is-loading')).toBeTruthy();
    });

    it('should render a placeholder', function () {
      expect(this.myLegend.$el.html()).toMatch('Placeholder');
    });
  });

  describe('if model has errors', function () {
    beforeEach(function () {
      this.model.set('state', 'error');
      this.myLegend.render();
    });

    it('should NOT mark legend as loading', function () {
      expect(this.myLegend.$el.hasClass('is-loading')).toBeFalsy();
    });

    it('should render a placeholder', function () {
      expect(this.myLegend.$el.html()).toMatch('Placeholder');
    });
  });

  describe('if model has been loaded and has no data', function () {
    beforeEach(function () {
      this.model.set('state', 'success');
      spyOn(this.model, 'isAvailable').and.returnValue(false);
      this.myLegend.render();
    });

    it('should NOT mark legend as loading', function () {
      expect(this.myLegend.$el.hasClass('is-loading')).toBeFalsy();
    });

    it('should render a placeholder', function () {
      expect(this.myLegend.$el.html()).toMatch('Placeholder');
    });
  });

  describe('if model has been loaded and has data', function () {
    beforeEach(function () {
      this.model.set('state', 'success');
      this.myLegend.render();
    });

    it('should NOT mark legend as loading', function () {
      expect(this.myLegend.$el.hasClass('is-loading')).toBeFalsy();
    });

    it('should NOT render a placeholder', function () {
      expect(this.myLegend.$el.html()).not.toMatch('Placeholder');
    });

    it('should render properly', function () {
      var html = this.myLegend.$el.html().split('\n');
      expect(html[0]).toMatch('My Beautiful Legend');
      expect(html[1]).toEqual('<p>before</p>');
      expect(html[2]).toEqual('<h1>It Works!</h1>');
      expect(html[3]).toEqual('<p>after</p>');
    });

    it('should sanitize preHTMLSnippet, compiled template and postHTMLSnippet', function () {
      this.model.set({
        preHTMLSnippet: '<p>before<script>alert("before");</script></p>',
        postHTMLSnippet: '<p>after<script>alert("after");</script></p>'
      });

      spyOn(this.myLegend, '_getCompiledTemplate').and.returnValue('<h1>It Works!<script>alert("It Works!");</script></h1>');

      this.myLegend.render();

      var html = this.myLegend.$el.html().split('\n');
      expect(html[1]).toEqual('<p>before</p>');
      expect(html[2]).toEqual('<h1>It Works!</h1>');
      expect(html[3]).toEqual('<p>after</p>');
    });
  });
});
