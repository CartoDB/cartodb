describe("mod.infowindow", function() {
  var view, model;
  var table;

  beforeEach(function() {
    model = new cdb.geo.ui.InfowindowModel({
      fields: [
        { name:'name1', title:true, position:0 }
      ]
    });
    table = new cdb.admin.CartoDBTableMetadata({
        name: 'testTable',
        schema: [
          ['name1', 'string'],
          ['name2', 'number'],
          ['name3', 'number']
        ]
      });

    view = new cdb.admin.mod.InfoWindow({
      el: $('<div>'),
      model: model,
      table: table
    });
  });

  it("should render/add 3 panes + 3 tabs + header + menu", function() {
    view.render();
    expect(_.size(view._subviews)).toBe(3); // themes view, infowindow tabs and infowindow panes
    expect(view.$('.header').length > 0).toBeTruthy();
    expect(view.infowindow_panes).toBeDefined();
    expect(_.size(view.infowindow_panes._subviews)).toBe(3);
    expect(view.infowindow_tabs).toBeDefined();
    expect(view.$('.menu').length > 0).toBeTruthy();
    expect(view.$('.menu a').length).toBe(3);
  });

  it("should select a different pane if template is not empty", function() {
    var m = new cdb.geo.ui.InfowindowModel({ template: '<div></div>' });
    var v = new cdb.admin.mod.InfoWindow({
      el: $('<div>'),
      model: m,
      table: table
    });

    v.render();

    expect(v.$('.header h3').text()).toBe('Custom HTML');
    expect(v.$('.header .doc_info').css('display')).not.toBe('none');
    expect(v.$('.header .form_combo').css('display')).toBe('none');
  });

  it("should check 'title pane' when there is any change in the table schema or in the fields", function() {
    view.render();
    model.set('fields', []);
    expect(_.size(view.infowindow_panes._subviews)).toBe(2);
    expect(view.$('.menu a.disabled').length).toBe(1);
    model.set('fields', [{ name:'jam', title:true, position:0 }]);
    expect(_.size(view.infowindow_panes._subviews)).toBe(3);
    expect(view.$('.menu a.disabled').length).toBe(0);
    table.set('schema', []);
    expect(_.size(view.infowindow_panes._subviews)).toBe(2);
    expect(view.$('.menu a.disabled').length).toBe(1);
    model.set('fields', [ { name:"jamon", title:false, position:0 }, { name:"ey", title:false, position:0 }]);
    expect(_.size(view.infowindow_panes._subviews)).toBe(2);
    expect(view.$('.menu a.disabled').length).toBe(1);
  });

  it("should change the title when a pane is active", function() {
    view.render();
    view.infowindow_panes.active('title');
    expect(view.$('.header h3').text()).toBe('Design');
    expect(view.$('.header .doc_info').css('display')).toBe('none');
    expect(view.$('.header .form_combo').css('display')).toBe('block');
  
    view.infowindow_panes.active('html');
    expect(view.$('.header h3').text()).toBe('Custom HTML');
    expect(view.$('.header .doc_info').css('display')).not.toBe('none');
    expect(view.$('.header .form_combo').css('display')).toBe('none');

    view.infowindow_panes.active('fields');
    expect(view.$('.header h3').text()).toBe('Design');
    expect(view.$('.header .doc_info').css('display')).toBe('none');
    expect(view.$('.header .form_combo').css('display')).toBe('block');
  });

  it("should change the header when template is changed", function() {
    view.render();
    view.infowindow_panes.active('html');
    model.set('template', '<div>{{ pisha }}</div>');
    expect(view.$('.header .blocked').css('display')).toBe('none');
  
    view.infowindow_panes.active('title');
    expect(view.$('.header .blocked').css('display')).toBe('block');

    view.infowindow_panes.active('fields');
    expect(view.$('.header .blocked').css('display')).toBe('block');
  });

  it("should send a trigger when a tab is selected", function() {
    view.render();
    spyOn(view, 'triggerModuleAction');
    view.infowindow_panes.active('html');
    expect(view.triggerModuleAction).toHaveBeenCalled();
  });

  it("should refresh codemirror when html editor is enabled", function() {
    view.render();
    spyOn(view, '_refreshHTMLEditor');
    view.infowindow_panes.active('html');
    expect(view._refreshHTMLEditor).toHaveBeenCalled();
  });


  ////////////////////////////
  // Infowindow Fields pane //
  ////////////////////////////
  describe("infowindow fields pane", function() {
    var view, model;
    var table;

    beforeEach(function() {
      model = new cdb.geo.ui.InfowindowModel();
      model.clearFields();
      table = new cdb.admin.CartoDBTableMetadata({
          name: 'testTable',
          schema: [
            ['name1', 'string'],
            ['name2', 'number'],
            ['name3', 'number']
          ]
        });

      view = new cdb.admin.mod.InfowindowFieldsPane({
        el: $('<div>'),
        model: model,
        table: table
      });
    });

    it("should render fields", function() {
      view.render();
      expect(view.$el.find('li').length).toEqual(3);
    });

    it("should toggle switches", function() {
      view.render();
      model.addField('name1').addField('name2');
      expect($(view.$el.find('.switch')[0]).hasClass('enabled')).toEqual(true);
      expect($(view.$el.find('.switch')[1]).hasClass('enabled')).toEqual(true);
      model.removeField('name1');
      expect($(view.$el.find('.switch')[0]).hasClass('enabled')).toEqual(false);
      expect($(view.$el.find('.switch')[1]).hasClass('enabled')).toEqual(true);
    });

    it("should disable select-all when all chosen", function() {
      view.render();
      model.addField('name1').addField('name2').addField('name3');
      expect($(view.$el.find('.selectall')[0]).hasClass('enabled')).toEqual(true);
    });

    it("should disable select-all", function() {
      view.render();
      model.addField('name1').addField('name2').addField('name3');
      model.removeField('name1');
      expect($(view.$el.find('.selectall')[0]).hasClass('disabled')).toEqual(true);
    });

    it("should assign fileds positions when there are no fields selected", function() {
      view.render();
      var i = 0;
      _.each(view._subviews, function(v) {
        expect(v.position).toEqual(i)
        ++i;
      });
    });

    it("should toggle titles", function() {
      view.render();
      model.addField('name1').addField('name2');
      expect($(view.$el.find('.title')[0]).hasClass('enabled')).toEqual(true);
      expect($(view.$el.find('.title')[1]).hasClass('enabled')).toEqual(true);
      model.setFieldProperty('name1', 'title', false);
      expect($(view.$el.find('.title')[0]).hasClass('enabled')).toEqual(false);
      expect($(view.$el.find('.title')[1]).hasClass('enabled')).toEqual(true);
    });

    it("should toggle fields on click", function() {
      view.render();
      model.addField('name1').addField('name2');
      $(view.$el.find('.switch')[0]).trigger('click');
      expect(model.containsField('name1')).toEqual(false);
      expect(model.containsField('name2')).toEqual(true);
    });

    it("should be placed in order", function() {
      view.render();
      model.addField('name1', 0).addField('name2', 1);
      var first = view.$el.find('.drag_field')[0];
      //move to last
      view.$el.append(first);
      view._reasignPositions();
      var fields = model.get('fields');
      expect(fields[0].name).toEqual('name2');
      expect(fields[1].name).toEqual('name1');
    });

    it("should show blocked panel when a template is set", function() {
      view.render();
      view.model.set('template', '<div></div>');
      expect(view.$('.blocked').css('display')).toBe('block');
      expect(view.$el.hasClass('disabled')).toBeTruthy();
    });

    it("should show no content panel when there isn't any column in the schema", function() {
      view.render();
      table.set('schema', []);
      expect(view.$('.no_content').css('display')).toBe('block');
      expect(view.$('li').length).toBe(0);
      expect(view.$('.all').css('display')).toBe('none');
    });
  });

  
  ////////////////////////////
  // Infowindow Titles pane //
  ////////////////////////////
  describe("infowindow titles pane", function() {
    var view, model;
    var table;

    beforeEach(function() {
      model = new cdb.geo.ui.InfowindowModel();
      table = new cdb.admin.CartoDBTableMetadata({
          name: 'testTable',
          schema: [
            ['name1', 'string'],
            ['name2', 'number'],
            ['name3', 'number']
          ]
        });

      view = new cdb.admin.mod.InfowindowTitlePane({
        el: $('<div>'),
        model: model,
        table: table
      });
    });

    it("should render titles", function() {
      view.render();
      expect(view.$el.find('li').length).toEqual(3);
    });

    it("should toggle titles", function() {
      view.render();
      model.addField('name1').addField('name2');
      expect(view.$('.edit_in_place').length).toBe(3);
      expect(view.$('.edit_in_place.disabled').length).toBe(1);
      model.removeField('name1');
      expect(view.$('.edit_in_place').length).toBe(3);
      expect(view.$('.edit_in_place.disabled').length).toBe(2);
    });

    it("should toggle titles on name fields change", function() {
      view.render();
      model
        .addField('name1')
        .addField('name2')
        .addField('name3');

      expect(view.$('.edit_in_place').length).toBe(3);
      expect(view.$('.edit_in_place.disabled').length).toBe(0);

      model.setFieldProperty('name1', 'title', false);
      expect(view.$('.edit_in_place').length).toBe(3);
      expect(view.$('.edit_in_place.disabled').length).toBe(1);
      expect(view.$('.edit_in_place.disabled .value span').text()).toBe('name1');
    });

    it("should show blocked panel when a template is set", function() {
      view.render();
      view.model.set('template', '<div></div>');
      expect(view.$('.blocked').css('display')).toBe('block');
      expect(view.$el.hasClass('disabled')).toBeTruthy();
    });

    it("should render the list sorted as fields-pane if it is defined", function() {
      var a_view = new cdb.admin.mod.InfowindowFieldsPane({
        el: $('<div>'),
        model: model,
        table: table
      });
      a_view.render();

      var b_view = new cdb.admin.mod.InfowindowTitlePane({
        el: $('<div>'),
        model: model,
        table: table,
        fields_pane: a_view
      });

      b_view.render();
      a_view.$('.switch:eq(1)').click();
      expect(b_view.$('ul.fields li:eq(0) .edit_in_place div.value span').text()).toBe('name1');
      expect(b_view.$('ul.fields li:eq(1) .edit_in_place').hasClass('disabled')).toBeFalsy();
      expect(b_view.$('ul.fields li:eq(1) .edit_in_place div.value span').text()).toBe('name2');
      expect(b_view.$('ul.fields li:eq(2) .edit_in_place div.value span').text()).toBe('name3');
    });
  });


  ////////////////////////////
  // Infowindow HTML pane //
  ////////////////////////////
  describe("infowindow HTML pane", function() {
    var view, model;
    var table;

    beforeEach(function() {
      model = new cdb.geo.ui.InfowindowModel({
        template_name: 'infowindow_light'
      });
      table = new cdb.admin.CartoDBTableMetadata({
          name: 'testTable',
          schema: [
            ['name1', 'string'],
            ['name2', 'number'],
            ['name3', 'number']
          ]
        });

      view = new cdb.admin.mod.InfowindowHTMLPane({
        el: $('<div>'),
        model: model,
        table: table
      });
    });

    it("should render HTML editor", function() {
      view.render();
      expect(view.$('.CodeMirror').length).toBe(1);
      expect(view.codeEditor.getValue().trim()).toBe('<div class="cartodb-popup">\n\
  <a href="#close" class="cartodb-popup-close-button close">x</a>\n\
  <div class="cartodb-popup-content-wrapper">\n\
    <div class="cartodb-popup-content">\n\
    </div>\n\
  </div>\n\
  <div class="cartodb-popup-tip-container"></div>\n\
</div>');
    });

    it("should apply infowindow template when template or fields change", function() {
      view.render();
      spyOn(view.codeEditor,'setValue');
      model.set('template_name', 'infowindow_dark');
      expect(view.codeEditor.setValue).toHaveBeenCalled();
    });

    it("should apply infowindow template when alternative_names change", function() {
      view.render();
      spyOn(view.codeEditor,'setValue');
      model.set('alternative_names', { name3: 'jamon' });
      expect(view.codeEditor.setValue).toHaveBeenCalled();
    });

    it("should show an error when template is not valid", function() {
      view.render();
      
      spyOn(view,'adjustCodeEditorSize');
      
      view.codeEditor.setValue('<div>{{name3.jamon}}</div>');
      view._apply();
      expect(view.$('.info').css('display')).toBe('block');
      expect(view.adjustCodeEditorSize).toHaveBeenCalled();

      view.codeEditor.setValue('<div>{{name3}}</div>');
      view._apply();
      expect(view.$('.info').css('display')).toBe('none');
      expect(view.adjustCodeEditorSize).toHaveBeenCalled();
    });

    it("should set the new table schema fields when a query is applied, only if a template is defined", function() {
      view.render();
      spyOn(view, '_apply');
      table.set("schema", [['paco', 'number']]);
      expect(view._apply).not.toHaveBeenCalled();

      view.codeEditor.setValue('<div>{{name3.jamon}}</div>');
      view._apply();
      table.set("schema", [['paco', 'number']]);
      expect(view._apply).toHaveBeenCalled();
    });

    it("should remove template variable when apply a custom infowindow", function() {
      view.render();
      model.set('fields', [{ name: 'name3', title: false, position:0 }]);
      view.codeEditor.setValue('<div>{{name3}}</div>');
      view._apply();
      expect(model.get('template_name')).toBe('');
      expect(model.get('old_fields').length).toBe(1);
      expect(model.get('template')).toBe('<div>{{name3}}</div>');
      expect(model.get('old_template_name')).toBe('infowindow_light');
    });
  });

});
