var $ = require('jquery');
var Backbone = require('backbone');
var Map = require('../../../../src/geo/map');
var MapView = require('../../../../src/geo/map-view');
var InfowindowModel = require('../../../../src/geo/ui/infowindow-model');
var Infowindow = require('../../../../src/geo/ui/infowindow-view');

describe('geo/ui/infowindow-view', function () {
  var model, view, mapView, map;

  beforeEach(function () {
    var container = $('<div>').css('height', '200px');

    map = new Map(null, { layersFactory: {} });

    mapView = new MapView({
      el: container,
      mapModel: map,
      visModel: new Backbone.Model(),
      layerViewFactory: jasmine.createSpyObj('layerViewFactory', ['createLayerView']),
      layerGroupModel: new Backbone.Model()
    });

    model = new InfowindowModel({
      fields: [
        { name: 'test1', position: 1, title: true },
        { name: 'test2', position: 2, title: true }
      ]
    });

    view = new Infowindow({
      model: model,
      mapView: mapView
    });
  });

  it('should add render when template changes', function () {
    spyOn(view, 'render');
    model.set('template', 'jaja');
    expect(view.render).toHaveBeenCalled();
  });

  it('should change width of the infowindow when width attribute changes', function () {
    spyOn(view, 'render');
    view.model.set({
      'template': '<div class="js-infowindow"></div>',
      'width': 100
    });
    expect(view.$('.js-infowindow').css('width')).toBe('100px');
  });

  it('shouldn\'t change width of the infowindow when width attribute is undefined', function () {
    spyOn(view, 'render');
    view.model.set({
      'template': '<div class="js-infowindow"></div>'
    });
    var previousWidth = view.$('.js-infowindow').css('width');

    // Unset the width from the model
    view.model.unset('width');

    // Width hasn't changed
    expect(view.$('.js-infowindow').css('width')).toBe(previousWidth);
  });

  it('should change maxHeight of the infowindow when maxHeight attribute changes', function () {
    spyOn(view, 'render');
    view.model.set({
      template: '<div class="js-infowindow"><div class="js-content"></div></div>',
      maxHeight: 100
    });
    expect(view.$('.js-content').css('max-height')).toBe('100px');
  });

  it('should render without alternative_name set', function () {
    var template = '<div class="js-infowindow">' +
      '<a href="#close" class="cartodb-popup-close-button close">x</a>' +
       '<div class="cartodb-popup-content-wrapper">' +
         '<div class="js-content">' +
           '<ul id="mylist"></ul>' +
         '</div>' +
       '</div>' +
       '<div class="hook"></div>' +
    '</div>';

    model.unset('alternative_names');
    model.set({
      content: {
        fields: [{
          title: 'test',
          value: true,
          position: 0,
          index: 0
        }]
      },
      template: template
    });

    expect(view.render().$el.html().length).not.toBe(0);
  });

  it('should render with alternative_name set', function () {
    model.set({
      content: {
        fields: [
          { name: 'jamon1', title: 'jamon1_', value: 'jamon1' }
        ]
      }
    }, { silent: true });

    view.render();

    var item1 = view.$el.find('.CDB-infowindow-listItem:nth-child(1)');
    expect(item1.find('.CDB-infowindow-title').text()).toEqual('jamon1');
    expect(item1.find('.CDB-infowindow-subtitle').text()).toEqual('jamon1_');
  });

  it('should render without title', function () {
    model.set({
      content: {
        fields: [
          { name: 'jamon1', title: null, value: 'jamon1' }
        ]
      }
    }, { silent: true });

    view.render();

    var item1 = view.$el.find('.CDB-infowindow-listItem:nth-child(1)');
    expect(item1.find('.CDB-infowindow-title').text()).toEqual('jamon1');
    expect(item1.find('.CDB-infowindow-subtitle').length).toBe(0);
  });

  it('should convert value to string when it is a number', function () {
    model.set({
      content: {
        fields: [{
          title: 'jamon1',
          value: 0,
          index: 0
        }, {
          title: 'jamon2',
          value: 1,
          index: 1
        }]
      }
    }, { silent: true });

    view.render();

    var item1 = view.$el.find('.CDB-infowindow-listItem:nth-child(1)');
    expect(item1.find('.CDB-infowindow-title').text()).toEqual('0');
    expect(item1.find('.CDB-infowindow-subtitle').text()).toEqual('jamon1');
    var item2 = view.$el.find('.CDB-infowindow-listItem:nth-child(2)');
    expect(item2.find('.CDB-infowindow-title').text()).toEqual('1');
    expect(item2.find('.CDB-infowindow-subtitle').text()).toEqual('jamon2');
  });

  it('should convert value to \'\' when it is undefined', function () {
    model.set({
      content: {
        fields: [{
          title: 'jamon', value: undefined
        }]
      }
    }, { silent: true });

    view.render();

    var item1 = view.$el.find('.CDB-infowindow-listItem:nth-child(1)');
    expect(item1.find('.CDB-infowindow-title').text()).toEqual('');
    expect(item1.find('.CDB-infowindow-subtitle').text()).toEqual('jamon');
  });

  it('should convert value to \'\' when it is null', function () {
    model.set('content', {
      fields: [{
        title: 'jamon',
        value: null
      }]
    }, { silent: true });

    view.render();

    var item1 = view.$el.find('.CDB-infowindow-listItem:nth-child(1)');
    expect(item1.find('.CDB-infowindow-title').text()).toEqual('');
    expect(item1.find('.CDB-infowindow-subtitle').text()).toEqual('jamon');
  });

  it('shouldn\'t convert the value if it is empty', function () {
    model.set('content', {
      fields: [{
        title: 'jamon',
        value: ''
      }]
    }, { silent: true });

    view.render();

    var item1 = view.$el.find('.CDB-infowindow-listItem:nth-child(1)');
    expect(item1.find('.CDB-infowindow-title').text()).toEqual('');
    expect(item1.find('.CDB-infowindow-subtitle').text()).toEqual('jamon');
  });

  it('should leave a string as it is', function () {
    model.set('content', {
      fields: [{
        title: 'jamon',
        value: 'jamon is testing'
      }]
    }, { silent: true });

    view.render();

    var item1 = view.$el.find('.CDB-infowindow-listItem:nth-child(1)');
    expect(item1.find('.CDB-infowindow-title').text()).toEqual('jamon is testing');
    expect(item1.find('.CDB-infowindow-subtitle').text()).toEqual('jamon');
  });

  it('should convert value to string when it is a boolean', function () {
    model.set('content', {
      fields: [
        { title: 'jamon1', value: false },
        { title: 'jamon2', value: true }
      ]
    }, { silent: true });

    view.render();

    var item1 = view.$el.find('.CDB-infowindow-listItem:nth-child(1)');
    expect(item1.find('.CDB-infowindow-title').text()).toEqual('false');
    expect(item1.find('.CDB-infowindow-subtitle').text()).toEqual('jamon1');
    var item2 = view.$el.find('.CDB-infowindow-listItem:nth-child(2)');
    expect(item2.find('.CDB-infowindow-title').text()).toEqual('true');
    expect(item2.find('.CDB-infowindow-subtitle').text()).toEqual('jamon2');
  });

  it('shouldn\'t convert the value if it is an object or an array', function () {
    var template = '<div class="js-infowindow">' +
      '<a href="#close" class="cartodb-popup-close-button close">x</a>' +
       '<div class="cartodb-popup-content-wrapper">' +
         '<div class="js-content">' +
           '<ul class="CDB-infowindow-listItem">{{#jamon1}}<li>{{jamon2}}, {{istrue}}, "{{isempty}}", {{isnum}}</li>{{/jamon1}}</ul>' +
           '<ul class="CDB-infowindow-listItem">{{#jamon3}}<li>{{.}}</li>{{/jamon3}}</ul>' +
         '</div>' +
       '</div>' +
       '<div class="hook"></div>' +
    '</div>';

    model.set({
      content: {
        fields: [
          { name: 'jamon1', title: 'jamon1', value: [{ jamon2: 'jamon2', istrue: true, isempty: '', isnum: 9 }] },
          { name: 'jamon3', title: 'jamon3', value: ['jamon4', 'jamon5'] }
        ]
      },
      template: template,
      template_type: 'mustache'
    });

    view.render();

    var item1 = view.$el.find('.CDB-infowindow-listItem:nth-child(1)');
    expect(item1.text()).toContain('jamon2, true, "", 9');
    var item2 = view.$el.find('.CDB-infowindow-listItem:nth-child(2)');
    expect(item2.text()).toContain('jamon4jamon5');
  });

  it('should close the infowindow when user clicks close button', function () {
    model.set({
      template: '<div><button class="js-close">X</button></div>'
    });
    view = new Infowindow({
      model: model,
      mapView: mapView
    });

    view.render();

    // Infowindow is visible
    model.set('visibility', true, { silent: true });
    expect(model.get('visibility')).toBe(true);

    view.$('.js-close').click();

    // Infowindow has been closed
    expect(model.get('visibility')).toBe(false);
  });

  describe('custom template', function () {
    var model, view;

    beforeEach(function () {
      var container = $('<div>').css('height', '200px');

      map = new Map(null, { layersFactory: {} });

      mapView = new MapView({
        el: container,
        mapModel: map,
        visModel: new Backbone.Model(),
        layerViewFactory: jasmine.createSpyObj('layerViewFactory', ['createLayerView']),
        layerGroupModel: new Backbone.Model()
      });

      model = new InfowindowModel({
        template: '<div>{{ test1 }}</div>',
        fields: [
          { title: 'test1', position: 1, value: 'x' },
          { title: 'test2', position: 2, value: 'b' }
        ]
      });

      view = new Infowindow({
        model: model,
        mapView: mapView
      });
    });

    it('should compile the template when changes', function () {
      view.model.set('template', '<div>{{test1}}</div>');
      expect(view.template({ test1: 'new' })).toEqual('<div>new</div>');
    });

    it('should render properly when there is only a field without title', function () {
      view.model.set({
        template: ['{{#content.fields}}',
          '<li class="CDB-infowindow-listItem">',
            '{{#title}}<h5 class="CDB-infowindow-subtitle">{{title}}</h5>{{/title}}',
            '{{#value}}<h4 class="CDB-infowindow-title">{{{ value }}}</h4>{{/value}}',
            '{{^value}}<h4 class="CDB-infowindow-title">null</h4>{{/value}}',
          '</li>',
          '{{/content.fields}}'].join(' '),
        content: {
          fields: [
            { name: 'test1', title: null, position: 0, value: 'jamon' }
          ]
        }
      });

      view.render();
      expect(view.$el.html()).toContain('<li class="CDB-infowindow-listItem">  <h4 class="CDB-infowindow-title">jamon</h4>  </li>');
    });

    it('should render with alternative_name set', function () {
      view.model.set({
        template: ['{{#content.fields}}',
          '<li class="CDB-infowindow-listItem">',
            '{{#title}}<h5 class="CDB-infowindow-subtitle">{{title}}</h5>{{/title}}',
            '{{#value}}<h4 class="CDB-infowindow-title">{{{ value }}}</h4>{{/value}}',
            '{{^value}}<h4 class="CDB-infowindow-title">null</h4>{{/value}}',
          '</li>',
          '{{/content.fields}}'].join(' '),
        content: {
          fields: [
            { name: 'test1', title: 'test1_', value: 'test1' }
          ]
        }
      });

      view.render();
      expect(view.$el.html()).toContain('<h5 class="CDB-infowindow-subtitle">test1_</h5> <h4 class="CDB-infowindow-title">test1</h4>');
    });

    it('shouldn\'t sanitize the fields', function () {
      spyOn(view, '_sanitizeField');
      view.render();
      expect(view._sanitizeField).not.toHaveBeenCalled();
    });

    it('should sanitize the template output by default', function () {
      view.model.set('template', 'no <iframe src="" onload="document.body.appendChild(document.createElement(\'script\')).src=\'http://localhost/xss.js\'"/> no');
      view.render();
      expect(view.$el.html()).toEqual('no ');
    });

    it('should allow to override sanitization', function () {
      view.model.set({
        template: 'no <iframe src="" onload="document.body.appendChild(document.createElement(\'script\')).src=\'http://localhost/xss.js\'"/> no',
        sanitizeTemplate: false
      });
      view.render();
      expect(view.$el.html()).toEqual('no <iframe src="" onload="document.body.appendChild(document.createElement(\'script\')).src=\'http://localhost/xss.js\'"></iframe> no');

      view.model.set('sanitizeTemplate', null);
      view.render();
      expect(view.$el.html()).toEqual('no <iframe src="" onload="document.body.appendChild(document.createElement(\'script\')).src=\'http://localhost/xss.js\'"></iframe> no');

      var customSanitizeSpy = jasmine.createSpy('sanitizeTemplateSpy').and.returnValue('<p>custom sanitizied result</p>');
      view.model.set('sanitizeTemplate', customSanitizeSpy);
      expect(customSanitizeSpy).toHaveBeenCalledWith('no <iframe src="" onload="document.body.appendChild(document.createElement(\'script\')).src=\'http://localhost/xss.js\'"/> no');
      view.render();
      expect(view.$el.html()).toEqual('<p>custom sanitizied result</p>');

      view.model.set('sanitizeTemplate', undefined);
      view.render();
      expect(view.$el.html()).toEqual('no ');
    });
  });

  describe('image template', function () {
    var model, view, container, fields, fieldsWithoutURL, fieldsWithInvalidURL, url;

    beforeEach(function () {
      container = $('<div>').css('height', '200px');
      url = 'http://fake.url/image.jpg';

      fields = [
        { title: 'test1', position: 1, value: 'http://fake.url/image.jpg' },
        { title: 'test2', position: 2, value: 'b' }
      ];

      fieldsWithInvalidURL = [
        { title: 'test1', position: 1, value: 'invalid_url' },
        { title: 'test2', position: 2, value: 'b' }
      ];

      fieldsWithoutURL = [
        { title: 'test1', position: 1, value: 'x' },
        { title: 'test2', position: 2, value: 'b' }
      ];

      map = new Map(null, { layersFactory: {} });

      mapView = new MapView({
        el: container,
        mapModel: map,
        visModel: new Backbone.Model(),
        layerViewFactory: jasmine.createSpyObj('layerViewFactory', ['createLayerView']),
        layerGroupModel: new Backbone.Model()
      });

      model = new InfowindowModel({
        content: {
          fields: fields
        }
      });

      view = new Infowindow({
        model: model,
        mapView: mapView
      });
    });

    it('should get the cover url', function () {
      expect(view._getCoverURL()).toEqual(url);
    });

    it('should validate the cover url', function () {
      var url = view._getCoverURL();
      expect(view._isValidURL(url)).toEqual(true);
    });

    it('should accept google chart URLS in the cover', function () {
      var url = 'http://chart.googleapis.com/chart?chxl=0:|1990%2F92|2001%2F03|2011%2F13&chxr=1,0,75&chxs=0,676767,11.5,0.5,lt,676767&chxt=x,y&chs=279x210&cht=lc&chco=FF0000&chds=0,69&chd=t:9.5,12.8,15.1,14.6,12.9,10.2,9.5,8.2,7.4,6.2,6,6.5,7.1,7.5,7.9,8,8.2,7.9,7.5,6.9,6.3,5.6&chg=-1,0,0,4&chls=1&chma=0,0,0,25&chm=B,EFEFEF,0,0,0&chtt=Malnourishment+in+&chts=676767,14';
      expect(view._isValidURL(url)).toEqual(true);
    });

    it('shouldn\'t modify the height of the cover when there are several fields', function () {
      model.set('content', { fields: fieldsWithoutURL });
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-cover" style="height:123px"><div class="CDB-hook"></div></div>');
      expect(view._containsCover()).toEqual(true);
      expect(view.$('.js-cover').height()).toEqual(123);
      expect(view.$('.CDB-hook img').length).toEqual(0);
    });

    it('should add the image cover class in the custom template', function () {
      spyOn(view, '_loadCoverFromTemplate').and.callThrough();
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-cover" style="height: 123px"><img src="http://fake.url" style="height: 100px"></div><div class="CDB-hook"></div></div>');
      expect(view._loadCoverFromTemplate).toHaveBeenCalled();
      expect(view._containsCover()).toEqual(true);
      expect(view.$('.CDB-infowindow-media-item').length).toEqual(1);
    });

    it('should setup the hook correctly', function () {
      spyOn(view, '_loadCoverFromUrl').and.callThrough();
      model.set('content', { fields: fields });
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-cover"></div><div class="CDB-hook"></div></div>');

      expect(view._loadCoverFromUrl).toHaveBeenCalled();

      view._onLoadImageSuccess();
      expect(view.$('.CDB-hook img').length).toEqual(1);
      expect(view.$('.CDB-hook img').attr('src')).toEqual('http://fake.url/image.jpg');
    });

    it('should detect if the infowindow has a cover', function () {
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-cover"></div></div>');
      expect(view._containsCover()).toEqual(true);
    });

    it('should render the loader for infowindows with cover', function () {
      model.set('content', { fields: fields });
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-cover"></div></div>');
      expect(view.$('.js-cover .js-loader').length).toEqual(1);
    });

    it('should append the image', function () {
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-cover"></div></div>');
      expect(view.$('img').length).toEqual(1);
    });

    it('shouldn\'t append an image if it\'s not valid', function () {
      model.set('content', { fields: fieldsWithoutURL });
      model.set('template', '<div class="js-infowindow header" data-cover="true"><div class="js-cover"></div></div>');
      expect(view.$('img').length).toEqual(0);
    });

    it('shouldn\'t append the image if the theme doesn\'t have cover', function () {
      model.set('content', { fields: fields });
      model.set('template', '<div class="js-cover"></div>');
      expect(view.$('img').length).toEqual(0);
    });

    it('should append a non-valid error message if the image is not valid', function () {
      model.set('content', { fields: fieldsWithInvalidURL });
      model.set('template', '<div class="js-infowindow header" data-cover="true"><div class="js-cover"></div></div>');
      expect(view.$el.find('.CDB-infowindow-fail').length).toEqual(1);
    });

    it('should add header class', function () {
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-header"></div></div>');
      expect(view.$el.find('.has-header').length).toEqual(1);
    });

    it('should add has-header-image class', function () {
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-cover"></div></div>');
      expect(view.$el.find('.has-header-image').length).toEqual(1);
    });

    it('should add has-fields class', function () {
      model.set('content', { fields: fields });
      model.set('template', '<div class="js-infowindow"><div class="js-content"></div></div>');
      expect(view.$el.find('.has-fields').length).toEqual(1);
    });

    it('should load image hook if fields is 2 or less and image height is equal or less than content height', function () {
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-cover" style="height: 123px"><img src="http://fake.url" class="CDB-infowindow-media-item"></div><div class="CDB-hook"></div></div>');
      spyOn(view, '_loadImageHook').and.callThrough();

      view.$el.height(100);
      view.$('.CDB-infowindow-media-item').height(200);
      view._onLoadImageSuccess();
      expect(view._loadImageHook).toHaveBeenCalled();

      view.$('.CDB-infowindow-media-item').height(90);
      view._loadImageHook.calls.reset();
      view._onLoadImageSuccess();
      expect(view._loadImageHook).not.toHaveBeenCalled();

      view.$('.CDB-infowindow-media-item').height(200);
      view._loadImageHook.calls.reset();
      fields.push({ title: 'test3', position: 3, value: 'c' });
      model.set('fields', fields);
      view._onLoadImageSuccess();
      expect(view._loadImageHook).not.toHaveBeenCalled();
    });

    it('should stop the loader and show an error if url is invalid', function () {
      spyOn(view, '_stopCoverLoader').and.callThrough();
      spyOn(view, '_showInfowindowImageError').and.callThrough();
      model.set({
        fields: fieldsWithInvalidURL,
        template: '<div class="js-infowindow" data-cover="true"><div class="js-cover" style="height: 123px"><img src="invalid.url" style="height: 100px"></div><div class="CDB-hook"></div></div>'
      });
      view.render();
      expect(view._stopCoverLoader).toHaveBeenCalled();
      expect(view._showInfowindowImageError).toHaveBeenCalled();
    });

    it('should stop the loader and show an error if url is invalid', function () {
      spyOn(view, '_stopCoverLoader').and.callThrough();
      spyOn(view, '_showInfowindowImageError').and.callThrough();
      model.set({
        fields: fieldsWithInvalidURL,
        template: '<div class="js-infowindow" data-cover="true"><div class="js-cover" style="height: 123px"><img src="invalid.url" style="height: 100px"></div><div class="CDB-hook"></div></div>'
      });
      view.render();
      expect(view._stopCoverLoader).toHaveBeenCalled();
      expect(view._showInfowindowImageError).toHaveBeenCalled();
    });

    it('should load the cover from template if it already contains the template', function () {
      spyOn(view, '_loadCoverFromTemplate').and.callThrough();
      model.set({
        fields: fieldsWithInvalidURL,
        template: '<div class="js-infowindow" data-cover="true"><div class="js-cover" style="height: 123px"><img src="http://fake.url" style="height: 100px"></div><div class="CDB-hook"></div></div>'
      });
      view.render();
      expect(view._loadCoverFromTemplate).toHaveBeenCalled();
    });

    it('should load the cover from url if it doesn\'t contain the template', function () {
      spyOn(view, '_loadCoverFromUrl').and.callThrough();
      model.set({
        fields: fieldsWithInvalidURL,
        template: '<div class="js-infowindow" data-cover="true"><div class="CDB-hook"></div></div>'
      });
      view.render();
      expect(view._loadCoverFromUrl).toHaveBeenCalled();
    });
  });
});
