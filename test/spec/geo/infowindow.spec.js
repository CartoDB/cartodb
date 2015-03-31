
describe("cdb.geo.ui.infowindow", function() {

  describe("model", function() {
    var model;
    beforeEach(function() {
      model = new cdb.geo.ui.InfowindowModel();
    });

    it("should allow adding an alternative name", function() {

      model.addField('the_name');
      model.addField('the_description');

      model.setAlternativeName('the_name', 'nombre');
      model.setAlternativeName('the_description', 'descripción');

      n = model.getAlternativeName('the_name');
      d = model.getAlternativeName('the_description');

      expect(n).toEqual("nombre");
      expect(d).toEqual("descripción");

    });

    it("should add a field", function() {
      expect(model.containsField('test')).toEqual(false);
      model.addField('test');
      model.addField('test2');
      expect(model.containsField('test')).toEqual(true);
      model.removeField('test');
      expect(model.containsField('test')).toEqual(false);
      expect(model.containsField('test2')).toEqual(true);
      model.clearFields();
      expect(model.containsField('test2')).toEqual(false);
    });

    it("should add a field in order", function() {
      model.addField('test', 1);
      model.addField('test2', 0);
      expect(model.get('fields')[0].name).toEqual('test2');
      expect(model.get('fields')[1].name).toEqual('test');
    });

    it("should allow modify field properties", function() {
      var spy = sinon.spy();
      model.addField('test');
      var t = model.getFieldProperty('test', 'title');
      expect(t).toEqual(true);
      model.bind('change:fields', spy);
      expect(spy.called).toEqual(false);
      model.setFieldProperty('test', 'title', false);
      t = model.getFieldProperty('test', 'title');
      expect(t).toEqual(false);
      expect(spy.called).toEqual(true);
    });

    it("should save and restore fields", function() {
      model.addField('test', 1);
      model.addField('test2', 0);
      model.addField('test3', 3);
      model.saveFields();
      expect(model.get('old_fields')).toEqual(model.get('fields'));
      model.clearFields();
      model.restoreFields();
      expect(model.get('old_fields')).toEqual(undefined);
      expect(model.get('fields')[0].name).toEqual('test2');
      expect(model.get('fields')[1].name).toEqual('test');
      expect(model.get('fields')[2].name).toEqual('test3');
    });
  });

  describe("view", function() {
    var model, view;

    beforeEach(function() {

      var container = $('<div>').css('height', '200px');

      map = new cdb.geo.Map();

      mapView = new cdb.geo.MapView({
        el: container,
        map: map
      });

      model = new cdb.geo.ui.InfowindowModel({
        fields: [
          { name: 'test1', position: 1, title: true},
          { name: 'test2', position: 2, title: true}
        ]
      });

      view = new cdb.geo.ui.Infowindow({
        model: model,
        mapView: mapView
      });

    });

    it("should add render when template changes", function() {
      spyOn(view, 'render');
      model.set('template', 'jaja');
      expect(view.render).toHaveBeenCalled()
    });

    it("should change width of the popup when width attribute changes", function() {
      spyOn(view, 'render');
      view.model.set({
        'template': '<div class="cartodb-popup"></div>',
        'width': 100
      });
      expect(view.$('.cartodb-popup').css('width')).toBe('100px');
    });

    it("shouldn't change width of the popup when width attribute is undefined", function() {
      spyOn(view, 'render');
      view.model.set({
        'template': '<div class="cartodb-popup v2"></div>'
      })
      view.model.unset('width');
      expect(view.$('.cartodb-popup').css('width')).toBe(undefined);
    });

    it("should change maxHeight of the popup when maxHeight attribute changes", function() {
      spyOn(view, 'render');
      view.model.set({
        'template': '<div class="cartodb-popup"><div class="cartodb-popup-content"></div></div>',
        'maxHeight': 100
      });
      expect(view.$('.cartodb-popup-content').css('max-height')).toBe('100px');
    });

    it("should render without alternative_name set", function() {
      var template = '<div class="cartodb-popup">\
        <a href="#close" class="cartodb-popup-close-button close">x</a>\
         <div class="cartodb-popup-content-wrapper">\
           <div class="cartodb-popup-content">\
             <ul id="mylist"></ul>\
           </div>\
         </div>\
         <div class="cartodb-popup-tip-container"></div>\
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

    it("should be null when there isn't any field", function() {
      spyOn(view, 'render');
      model.set('fields', []);
      expect(view.render).not.toHaveBeenCalled();
      expect(view.$el.html()).toEqual('');
    });
  });

  describe("contentForFields", function() {

    it('should return the title and value of each field', function() {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1', title: true }];
      var content = cdb.geo.ui.InfowindowModel.contentForFields(attributes, fields, {})

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0].title).toEqual('field1');
      expect(content.fields[0].value).toEqual('value1');
    });

    it('should not return the title if not specified', function() {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1' }]; // Field doesn't have a title attribute
      var content = cdb.geo.ui.InfowindowModel.contentForFields(attributes, fields, {})

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0].title).toEqual(null);
    });

    it('should return the index of each field', function() {
      var attributes = { field1: 'value1', field2: 'value2' };
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var content = cdb.geo.ui.InfowindowModel.contentForFields(attributes, fields, {})

      expect(content.fields.length).toEqual(2);
      expect(content.fields[0].index).toEqual(0);
      expect(content.fields[1].index).toEqual(1);
    });

    it('should return empty fields', function() {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var options = { empty_fields: true };
      var content = cdb.geo.ui.InfowindowModel.contentForFields(attributes, fields, options)

      expect(content.fields.length).toEqual(2);
      expect(content.fields[0]).toEqual({
        title: null,
        value: 'value1',
        index: 0
      });
      expect(content.fields[1]).toEqual({
        title: null,
        value: undefined,
        index: 1
      });
    });

    it('should not return empty fields', function() {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var options = { empty_fields: false };
      var content = cdb.geo.ui.InfowindowModel.contentForFields(attributes, fields, options)

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0]).toEqual({
        title: null,
        value: 'value1',
        index: 0
      });
    });

    it('should not return fields with a null value', function() {
      var attributes = { field1: 'wadus', field2: null };
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var content = cdb.geo.ui.InfowindowModel.contentForFields(attributes, fields, {})

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0]).toEqual({
        title: null,
        value: 'wadus',
        index: 0
      });
    });

    it('should return the attributes as data', function() {
      var attributes = { field1: 'value1' };
      var fields = [{ name: 'field1' }];
      var content = cdb.geo.ui.InfowindowModel.contentForFields(attributes, fields, {})

      expect(content.data).toEqual(attributes);
    });

    it('should return an empty field when no data is available', function() {
      var attributes = {};
      var fields = [{ name: 'field1' }, { name: 'field2' }];
      var content = cdb.geo.ui.InfowindowModel.contentForFields(attributes, fields, {})

      expect(content.fields.length).toEqual(1);
      expect(content.fields[0]).toEqual({
        title: null,
        value: 'No data available',
        index: 0,
        type: 'empty'
      });
    });
  });


  describe("loading state", function() {
    var model, view;

    beforeEach(function() {

      var container = $('<div>').css('height', '200px');

      map = new cdb.geo.Map();

      mapView = new cdb.geo.MapView({
        el: container,
        map: map
      });

      model = new cdb.geo.ui.InfowindowModel({
        fields: [
          { value: 'Loading content...', index: null, title: null, type: 'loading'}
        ]
      });

      view = new cdb.geo.ui.Infowindow({
        model: model,
        mapView: mapView
      });

    });

    it("should show loading state", function() {
      spyOn(view, '_startSpinner');
      model.set({
        'template': 'jaja',
        'content': {
          fields: [
            { value: 'Loading content...', index: null, title: null, type: 'loading'}
          ]
        }
      });
      expect(view._startSpinner).toHaveBeenCalled();
    });

    it("should hide loading state", function() {
      model.set({
        'template': 'jaja',
        'content': {
          fields: [
            { value: 'Loading content...', index: null, title: null, type: 'loading'}
          ]
        }
      });

      spyOn(view, '_stopSpinner');
      model.set({
        'template': 'jaja',
        'content': {
          fields: [
            { value: 'Any kind of value', index: 0, title: 'TITLE'}
          ]
        }
      });
      expect(view._stopSpinner).toHaveBeenCalled();
    });

    it("shouldn't show the loader if there are several fields", function() {
      spyOn(view, '_stopSpinner');
      spyOn(view, '_startSpinner');
      model.set({
        'template': 'jaja',
        'content': {
          fields: [
            { value: 'Loading content...', index: null, title: null, type: 'loading'},
            { value: 'Loading content...', index: null, title: null, type: 'loading'}
          ]
        }
      });
      expect(view._stopSpinner).toHaveBeenCalled();
      expect(view._startSpinner).not.toHaveBeenCalled();
    });
  });


  describe("custom template", function() {
    var model, view;

    beforeEach(function() {

      var container = $('<div>').css('height', '200px');

      map = new cdb.geo.Map();

      mapView = new cdb.geo.MapView({
        el: container,
        map: map
      });

      model = new cdb.geo.ui.InfowindowModel({
        template: '<div>{{ test1 }}</div>',
        fields: [
          { title: 'test1', position: 1, value: "x" },
          { title: 'test2', position: 2, value: "b" }
        ]
      });

      view = new cdb.geo.ui.Infowindow({
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

      var new_view = new cdb.geo.ui.Infowindow({
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
      expect(view.$el.html()).toEqual('no <iframe> no</iframe>');
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
      expect(view.$el.html()).toEqual('no <iframe> no</iframe>');
    });
  });

  describe("image template", function() {
    var model, view, container, fields, fieldsWithoutURL, url;

    beforeEach(function() {

      url = "http://assets.javierarce.com/lion.png";

      container = $('<div>').css('height', '200px');

      fields = [
        { title: 'test1', position: 1, value: url },
        { title: 'test2', position: 2, value: "b"}
      ];

      fieldsWithoutURL = [
        { title: 'test1', position: 1, value: "x" },
        { title: 'test2', position: 2, value: "b"}
      ];

      map = new cdb.geo.Map();

      mapView = new cdb.geo.MapView({
        el: container,
        map: map
      });

      model = new cdb.geo.ui.InfowindowModel({
        content: {
        fields: fields
        }
      });

      view = new cdb.geo.ui.Infowindow({
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

    it("should detect if the infowindow has a cover", function() {
      model.set('template', '<div class="cartodb-popup header" data-cover="true"><div class="cover"></div></div>');
      expect(view._containsCover()).toEqual(true);
    });

    it("should append the image", function() {
      model.set('template', '<div class="cartodb-popup header" data-cover="true"><div class="cover"></div></div>');
      expect(view.$el.find("img").length).toEqual(1);
    });

    it("if the image is invalid it shouldn't append it", function() {
      model.set("content", { fields: fieldsWithoutURL });
      model.set('template', '<div class="cartodb-popup header" data-cover="true"><div class="cover"></div></div>');
      expect(view.$el.find("img").length).toEqual(0);
    });

    it("if the theme doesn't have cover don't append the image", function() {
      model.set("content", { fields: fields });
      model.set('template', '<div class="cover"></div>');
      expect(view.$el.find("img").length).toEqual(0);
    });

  });

});
