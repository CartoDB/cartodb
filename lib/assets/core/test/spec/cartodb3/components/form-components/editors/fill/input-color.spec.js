var Backbone = require('backbone');
var InputColor = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/input-color');
var rampList = require('../../../../../../../javascripts/cartodb3/components/form-components/editors/fill/input-color/input-ramps/ramps');

describe('components/form-components/editors/fill/input-color', function () {
  beforeEach(function () {
    this.model = new Backbone.Model({
      bins: 5,
      range: ['#FFF', '#FABADA', '#00FF00', '#000', '#999999'],
      attribute: 'column1',
      quantification: 'jenks',
      opacity: 0.5
    });
    this.view = new InputColor(({
      model: this.model,
      configModel: {},
      query: 'SELECT * from table',
      columns: [
        { label: 'column1', type: 'number' },
        { label: 'column2', type: 'number' },
        { label: 'column3', type: 'number' }
      ]
    }));
    this.view.render();
  });

  it('should get selected', function () {
    this.model.set('selected', true);
    expect(this.view.$el.hasClass('is-active')).toBeTruthy();
  });

  it('should create a content view', function () {
    expect(this.view.model.get('createContentView')).toBeDefined();
  });

  it('should trigger a click event when clicked', function () {
    var clickEvent = false;
    this.view.bind('click', function () {
      clickEvent = true;
    });
    this.view.$el.click();
    expect(clickEvent).toBeTruthy();
  });

  describe('range', function () {
    beforeEach(function () {
      this.model = new Backbone.Model({
        bins: 5,
        range: ['#FFFFFF', '#FABADA', '#00FF00', '#000000', '#999999'],
        attribute: 'column1',
        quantification: 'Jenks',
        opacity: 0.50
      });
      this.view = new InputColor(({
        model: this.model,
        configModel: {},
        query: 'SELECT * from table',
        columns: [
          { label: 'column1', type: 'number' },
          { label: 'column2', type: 'number' },
          { label: 'column3', type: 'number' }
        ]
      }));
      this.view.render();
    });

    it('should render properly', function () {
      expect(this.view.$('.ColorBar').length).toBe(1);
    });

    it('should update when the value has changed', function () {
      this.model.set('range', ['#FFFFFF', '#FFFF00', '#0000FF']);
      expect(this.view.$('.ColorBar').length).toBe(1);
      expect(this.view.$('.ColorBar').attr('style')).toBeDefined();
      expect(this.view._getValue()).toEqual(['rgba(255, 255, 255, 0.5)', 'rgba(255, 255, 0, 0.5)', 'rgba(0, 0, 255, 0.5)']);
    });

    it('should set opacity for each color', function () {
      this.model.set({
        range: ['#FABADA', '#00FFAA', '#0000FF'],
        opacity: 0.99
      });
      expect(this.view.$('.ColorBar').length).toBe(1);
      expect(this.view.$('.ColorBar').attr('style')).toBeDefined();
      expect(this.view._getValue()).toEqual(['rgba(250, 186, 218, 0.99)', 'rgba(0, 255, 170, 0.99)', 'rgba(0, 0, 255, 0.99)']);
    });
  });

  describe('with image', function () {
    var svgResponse = {
      status: 200,
      contentType: 'image/svg+xml',
      responseText: '<svg xmlns:a="genius.com" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg"><path></path></svg>'
    };
    var imgUrl = 'http://www.image.com/image.svg';
    var fixed = '#c0ffee';
    var obj = {
      callback: function () {}
    };
    var fixture;

    beforeEach(function () {
      jasmine.Ajax.install();
      jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*/image.svg'))
        .andReturn(svgResponse);

      this.model = new Backbone.Model({
        image: imgUrl,
        opacity: 0.5,
        fixed: fixed
      });
      this.view = new InputColor(({
        model: this.model,
        userModel: {
          featureEnabled: function () {
            return true;
          }
        },
        modals: {},
        configModel: {},
        editorAttrs: {
          imageEnabled: true
        },
        query: 'SELECT * from table',
        columns: [
          { label: 'column1', type: 'number' },
          { label: 'column2', type: 'number' },
          { label: 'column3', type: 'number' }
        ]
      }));

      spyOn(this.view, '_requestSVG').and.callThrough();

      // For getting right values from the SVG element, it needs to be attached to the DOM
      fixture = document.createElement('div');
      fixture.id = 'fixture';
      document.getElementsByTagName('body')[0].appendChild(fixture);
      fixture.appendChild(this.view.$el[0]);

      this.view.render();
    });

    afterEach(function () {
      fixture.parentNode.removeChild(fixture);
      jasmine.Ajax.uninstall();
    });

    it('should render the image', function () {
      expect(this.view.$('.Editor-fillImage').length).toBe(1);
    });

    it('after render calls _loadSVG, img should have been replaced by the SVG', function () {
      var image = this.view.$('.js-image');

      expect(this.view._requestSVG).toHaveBeenCalled();
      expect(image[0].tagName.toUpperCase()).toBe('SVG');
      expect(image.attr('xmlns:a')).toBeUndefined();
      expect(image.attr('src')).toBe(imgUrl);
      expect(image.attr('class')).toContain('Editor-fillImageAsset');
      expect(image.attr('class')).toContain('js-image');
      var cssFill = image.css('fill').toLowerCase();
      var pathFill = image.find('path').css('fill').toLowerCase();
      expect(cssFill === 'rgb(192, 255, 238)' || cssFill === '#c0ffee').toBe(true);
      expect(pathFill === 'rgb(192, 255, 238)' || pathFill === '#c0ffee').toBe(true);
    });

    it('._updateImageColor should change fill attribute and reload SVG if the element is an IMG', function () {
      this.view.$('.js-image').replaceWith('<img class="js-image"></img>');
      spyOn(this.view, '_loadSVG');

      // Trigger _updateImageColor via model change
      this.view.model.set('fixed', '#0FF1CE'); // rgb(15, 241, 206)

      var image = this.view.$('.js-image');
      var cssFill = image.css('fill').toLowerCase();
      expect(cssFill === 'rgb(15, 241, 206)' || cssFill === '#0ff1ce').toBe(true);
      expect(this.view._loadSVG).toHaveBeenCalled();
    });

    it('._requestSVG successful caches the response and calls the callback', function () {
      spyOn(obj, 'callback');
      this.view._lastSVG.url = null;
      this.view._lastSVG.content = null;
      jasmine.Ajax.requests.reset();

      this.view._requestSVG(imgUrl, obj.callback);

      expect(jasmine.Ajax.requests.mostRecent().url).toBe(imgUrl);
      expect(obj.callback).toHaveBeenCalled();
      expect(this.view._lastSVG.url).toBe(imgUrl);
      expect(this.view._lastSVG.content).toBeDefined();
    });

    it('.requestSVG with cached response, does not make an Ajax call and it calls the callback', function () {
      spyOn(obj, 'callback');
      jasmine.Ajax.requests.reset();

      this.view._requestSVG(imgUrl, obj.callback);

      expect(jasmine.Ajax.requests.mostRecent()).toBeUndefined();
      expect(obj.callback).toHaveBeenCalled();
      expect(this.view._lastSVG.url).toBe(imgUrl);
      expect(this.view._lastSVG.content).toBeDefined();
    });

    it('.requestSVG with error response, throws an error', function () {
      this.view._lastSVG.url = null;
      this.view._lastSVG.content = null;
      jasmine.Ajax.stubRequest(new RegExp('^http(s)?.*/image.svg'))
        .andReturn({ status: 500 });

      var foo = function () {
        this.view._requestSVG(imgUrl, obj.callback);
      };

      expect(foo).toThrow();
    });
  });

  describe('migrate old range', function () {
    beforeEach(function () {
      this.model = new Backbone.Model({
        bins: 5,
        range: 'inverted_green',
        attribute: 'column1',
        quantification: 'jenks',
        opacity: 0.5
      });
      this.view = new InputColor(({
        model: this.model,
        configModel: {},
        query: 'SELECT * from table',
        columns: [
          { label: 'column1', type: 'number' },
          { label: 'column2', type: 'number' },
          { label: 'column3', type: 'number' }
        ]
      }));
      this.view.render();
    });

    it('should migrate the range', function () {
      expect(this.model.get('range')).toBe(rampList['inverted_green'][5]);
    });
  });

  afterEach(function () {
    this.view.remove();
  });
});
