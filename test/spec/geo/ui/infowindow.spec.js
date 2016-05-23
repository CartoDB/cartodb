var $ = require('jquery');
var Backbone = require('backbone');
var Map = require('../../../../src/geo/map');
var MapView = require('../../../../src/geo/map-view');
var InfowindowModel = require('../../../../src/geo/ui/infowindow-model');
var Infowindow = require('../../../../src/geo/ui/infowindow-view');

describe('geo/ui/infowindow-view', function() {
  var model, view;

  beforeEach(function() {
    var container = $('<div>').css('height', '200px');

    map = new Map();

    mapView = new MapView({
      el: container,
      map: map,
      layerViewFactory: jasmine.createSpyObj('layerViewFactory', ['createLayerView']),
      layerGroupModel: new Backbone.Model()
    });

    model = new InfowindowModel({
      fields: [
        { name: 'test1', position: 1, title: true},
        { name: 'test2', position: 2, title: true}
      ]
    });

    view = new Infowindow({
      model: model,
      mapView: mapView
    });
  });

  it("should add render when template changes", function() {
    spyOn(view, 'render');
    model.set('template', 'jaja');
    expect(view.render).toHaveBeenCalled();
  });

  it("should change width of the infowindow when width attribute changes", function() {
    spyOn(view, 'render');
    view.model.set({
      'template': '<div class="js-infowindow"></div>',
      'width': 100
    });
    expect(view.$('.js-infowindow').css('width')).toBe('100px');
  });

  it("shouldn't change width of the infowindow when width attribute is undefined", function() {
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

  it("should change maxHeight of the infowindow when maxHeight attribute changes", function() {
    spyOn(view, 'render');
    view.model.set({
      'template': '<div class="js-infowindow"><div class="js-content"></div></div>',
      'maxHeight': 100
    });
    expect(view.$('.js-content').css('max-height')).toBe('100px');
  });

  it("should render without alternative_name set", function() {
    var template = '<div class="js-infowindow">\
      <a href="#close" class="cartodb-popup-close-button close">x</a>\
       <div class="cartodb-popup-content-wrapper">\
         <div class="js-content">\
           <ul id="mylist"></ul>\
         </div>\
       </div>\
       <div class="hook"></div>\
    </div>';

    model.unset('alternative_names');
    model.set({
      content: {
        fields: [ { title:'test', value:true, position:0, index:0 } ]
      },
      template_name:'infowindow_light',
      template: template
    });

    expect(view.render().$el.html().length).not.toBe(0);
  });

  it("should convert value to string when it is a number", function() {
    model.set({
      content: {
        fields: [{
            title: 'jamon1', value: 0, index:0
          }, {
            title: 'jamon2', value: 1, index:1
          }]
      },
      template_name: 'jaja'
    }, {silent: true});

    var render_fields = view._fieldsToString(model.attributes.content.fields, model.attributes.template_name);

    expect(render_fields[0].value).toEqual("0");
    expect(render_fields[1].value).toEqual("1");
  });

  it("should convert value to '' when it is undefined", function() {
    model.set({
      content: { fields: [{ title: 'jamon', value: undefined}] },
      template_name: 'jaja'
    }, {silent: true});

    var render_fields = view._fieldsToString(model.attributes.content.fields, model.attributes.template_name);
    expect(render_fields[0].value).toEqual('');
  });

  it("should convert value to '' when it is null", function() {
    model.set('content', { fields: [{ title: 'jamon', value: null}] }, {silent: true});

    var render_fields = view._fieldsToString(model.attributes.content.fields, model.attributes.template_name);
    expect(render_fields[0].value).toEqual('');
  });

  it("shouldn't convert the value if it is empty", function() {
    model.set('content', { fields: [{ title: 'jamon', value: ''}] }, {silent: true});

    var render_fields = view._fieldsToString(model.attributes.content.fields, model.attributes.template_name);
    expect(render_fields[0].value).toEqual('');
  });

  it("should leave a string as it is", function() {
    model.set('content', { fields: [{ title: 'jamon', value: "jamon is testing"}] }, {silent: true});

    var render_fields = view._fieldsToString(model.attributes.content.fields, model.attributes.template_name);
    expect(render_fields[0].value).toEqual("jamon is testing");
  });

  it("should convert value to string when it is a boolean", function() {
    model.set('content', { fields: [{ title: 'jamon1', value: false}, { title: 'jamon2', value: true}] }, {silent: true});

    var render_fields = view._fieldsToString(model.attributes.content.fields, model.attributes.template_name);

    expect(render_fields[0].value).toEqual("false");
    expect(render_fields[1].value).toEqual("true");
  });

  describe("custom template", function() {
    var model, view;

    beforeEach(function() {

      var container = $('<div>').css('height', '200px');

      map = new Map();

      mapView = new MapView({
        el: container,
        map: map,
        layerViewFactory: jasmine.createSpyObj('layerViewFactory', ['createLayerView']),
        layerGroupModel: new Backbone.Model()
      });

      model = new InfowindowModel({
        template: '<div>{{ test1 }}</div>',
        fields: [
          { title: 'test1', position: 1, value: "x" },
          { title: 'test2', position: 2, value: "b" }
        ]
      });

      view = new Infowindow({
        model: model,
        mapView: mapView
      });

    });

    it("should compile the template when changes", function() {
      view.model.set('template', '<div>{{test1}}</div>');
      expect(view.template({ test1: 'new' })).toEqual('<div>new</div>');
    });

    it("should render properly when there is only a field without title", function() {
      model.set({
        fields: [
          { name: 'test1', position: 0, title: false },
        ],
        content: {
          fields: [
            { title: 'test1', position: 0, value: 'jamon' },
          ]
        }
      });

      var new_view = new Infowindow({
        model: model,
        mapView: mapView
      });

      expect(new_view.render().$el.html()).toBe('<div>jamon</div>');
    });

    it("shouldn't sanitize the fields", function() {
      spyOn(view, '_sanitizeField');
      view.render();
      expect(view._sanitizeField).not.toHaveBeenCalled();
    });

    it('should sanitize the template output by default', function() {
      view.model.set('template', 'no <iframe src="" onload="document.body.appendChild(document.createElement(\'script\')).src=\'http://localhost/xss.js\'"/> no');
      view.render();
      expect(view.$el.html()).toEqual('no ');
    });

    it('should allow to override sanitization', function() {
      view.model.set({
        template: 'no <iframe src="" onload="document.body.appendChild(document.createElement(\'script\')).src=\'http://localhost/xss.js\'"/> no',
        sanitizeTemplate: false
      });
      view.render();
      expect(view.$el.html()).toEqual('no <iframe src="" onload="document.body.appendChild(document.createElement(\'script\')).src=\'http://localhost/xss.js\'"></iframe> no');

      view.model.set('sanitizeTemplate', null);
      view.render();
      expect(view.$el.html()).toEqual('no <iframe src="" onload="document.body.appendChild(document.createElement(\'script\')).src=\'http://localhost/xss.js\'"></iframe> no');

      customSanitizeSpy = jasmine.createSpy('sanitizeTemplateSpy').and.returnValue('<p>custom sanitizied result</p>');
      view.model.set('sanitizeTemplate', customSanitizeSpy);
      expect(customSanitizeSpy).toHaveBeenCalledWith('no <iframe src="" onload="document.body.appendChild(document.createElement(\'script\')).src=\'http://localhost/xss.js\'"/> no');
      view.render();
      expect(view.$el.html()).toEqual('<p>custom sanitizied result</p>');

      view.model.set('sanitizeTemplate', undefined);
      view.render();
      expect(view.$el.html()).toEqual('no ');
    });
  });

  describe("image template", function() {
    var model, view, container, fields, fieldsWithoutURL, fieldsWithInvalidURL, url;

    beforeEach(function() {

      container = $('<div>').css('height', '200px');
      url = "http://fake.url/image.jpg";

      fields = [
        { title: 'test1', position: 1, value: "http://fake.url/image.jpg" },
        { title: 'test2', position: 2, value: "b"}
      ];

      fieldsWithInvalidURL = [
        { title: 'test1', position: 1, value: "invalid_url" },
        { title: 'test2', position: 2, value: "b"}
      ];

      fieldsWithoutURL = [
        { title: 'test1', position: 1, value: "x" },
        { title: 'test2', position: 2, value: "b"}
      ];

      map = new Map();

      mapView = new MapView({
        el: container,
        map: map,
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

    it("should get the cover url", function() {
      expect(view._getCoverURL()).toEqual(url);
    });

    it("should validate the cover url", function() {
      var url = view._getCoverURL();
      expect(view._isValidURL(url)).toEqual(true);
    });

    it("should accept google chart URLS in the cover", function() {
      var url = "http://chart.googleapis.com/chart?chxl=0:|1990%2F92|2001%2F03|2011%2F13&chxr=1,0,75&chxs=0,676767,11.5,0.5,lt,676767&chxt=x,y&chs=279x210&cht=lc&chco=FF0000&chds=0,69&chd=t:9.5,12.8,15.1,14.6,12.9,10.2,9.5,8.2,7.4,6.2,6,6.5,7.1,7.5,7.9,8,8.2,7.9,7.5,6.9,6.3,5.6&chg=-1,0,0,4&chls=1&chma=0,0,0,25&chm=B,EFEFEF,0,0,0&chtt=Malnourishment+in+&chts=676767,14";
      expect(view._isValidURL(url)).toEqual(true);
    });

    it("shouldn't modify the height of the cover when there are several fields", function() {
      model.set("content", { fields: fieldsWithoutURL });
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-cover" style="height:123px"><div class="js-hook"></div></div>');
      expect(view._containsCover()).toEqual(true);
      expect(view.$(".js-cover").height()).toEqual(123);
      expect(view.$(".js-hook img").length).toEqual(0);
    });

    it("should add the image cover class in the custom template", function() {
      spyOn(view, '_loadCoverFromTemplate').and.callThrough();
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-cover" style="height: 123px"><img src="http://fake.url" style="height: 100px"></div><div class="js-hook"></div></div>');
      expect(view._loadCoverFromTemplate).toHaveBeenCalled();
      expect(view._containsCover()).toEqual(true);
      expect(view.$(".CDB-infowindow-media-item").length).toEqual(1);
    });

    it("should setup the hook correctly", function() {
      spyOn(view, '_loadCoverFromUrl').and.callThrough();
      model.set("content", { fields: fields });
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-cover"></div><div class="js-hook"></div></div>');

      expect(view._loadCoverFromUrl).toHaveBeenCalled();

      view._onLoadImage();
      expect(view.$(".js-hook svg").length).toEqual(1);
      expect(view.$(".js-hook svg path").attr('d')).toEqual('M0,0 L0,16 L24,0 L0,0 Z');
    });

    it("should detect if the infowindow has a cover", function() {
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-cover"></div></div>');
      expect(view._containsCover()).toEqual(true);
    });

    it("should render the loader for infowindows with cover", function() {
      model.set("content", { fields: fields });
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-cover"></div></div>');
      expect(view.$el.find(".js-cover .js-loader").length).toEqual(1);
    });

    it("should append the image", function() {
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-cover"></div></div>');
      expect(view.$el.find("img").length).toEqual(1);
    });

    it("shouldn't append an image if it's not valid", function() {
      model.set("content", { fields: fieldsWithoutURL });
      model.set('template', '<div class="js-infowindow header" data-cover="true"><div class="js-cover"></div></div>');
      expect(view.$el.find("img").length).toEqual(0);
    });

    it("shouldn't append the image if the theme doesn't have cover", function() {
      model.set("content", { fields: fields });
      model.set('template', '<div class="js-cover"></div>');
      expect(view.$el.find("img").length).toEqual(0);
    });

    it("should append a non-valid error message if the image is not valid", function() {
      model.set("content", { fields: fieldsWithInvalidURL });
      model.set('template', '<div class="js-infowindow header" data-cover="true"><div class="js-cover"></div></div>');
      expect(view.$el.find(".CDB-infowindow-fail").length).toEqual(1);
    });

    it("should add header class", function() {
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-header"></div></div>');
      expect(view.$el.find(".has-header").length).toEqual(1);
    });

    it("should add has-header-image class", function() {
      model.set('template', '<div class="js-infowindow" data-cover="true"><div class="js-cover"></div></div>');
      expect(view.$el.find(".has-header-image").length).toEqual(1);
    });

    it("should add has-fields class", function() {
      model.set("content", { fields: fields });
      model.set('template', '<div class="js-infowindow"><div class="js-content"></div></div>');
      expect(view.$el.find(".has-fields").length).toEqual(1);
    });


  });
});
