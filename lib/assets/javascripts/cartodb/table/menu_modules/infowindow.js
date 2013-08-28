/**
 * info window module, allow to edit the infowindow appearance
 * and the fields that will be shown
 */

cdb.admin.mod = cdb.admin.mod || {};

(function() {

  var FieldItem = cdb.core.View.extend({

    tagName: 'li',

    events: {
      'click .switch':    'toggle',
      'click .title':     'toggleTitle'
    },

    template: _.template(
      '<span class="ellipsis"><%- fieldName %></span><div class="input"></div>'),

      initialize: function() {
        this.fieldName = this.options.field;
        this.position  = this.options.position;

        this.add_related_model(this.model);
      },

      toggle: function(e) {
        e.preventDefault();

        if (!this.model.containsField(this.fieldName)) {
          this.model.addField(this.fieldName, this.position);
        } else {
          this.model.removeField(this.fieldName);
        }

        return false;
      },

      toggleTitle: function(e) {
        e.preventDefault();
        var t = this.model.getFieldProperty(this.fieldName, 'title');
        this.model.setFieldProperty(this.fieldName, 'title', !t);
        return false;
      },

      _renderField: function() {

        this.fieldModel = new cdb.core.Model({ title: this.model.getAlternativeName(this.fieldName) || null });

        var self = this;

        this.fieldModel.bind("change:title", function() {
          self.model.setAlternativeName(self.fieldName, this.get("title"));
        });

        this.editInPlace = new cdb.admin.EditInPlace({
          observe: "title",
          model: this.fieldModel,
          stripHTML: true,
          el: this.$el.find(".input")
        });

        this.addView(this.editInPlace);


      },

      render: function() {
        this.$el.append(this.template(this));

        this._renderField();

        return this;
      }

  });

  var Field = cdb.core.View.extend({

    tagName: 'li',

    events: {
      'click .switch':    'toggle',
      'click .title':     'toggleTitle'
    },

    template: _.template(
      '<span class="ellipsis"><%- fieldName %></span>\
      <div class="switches">\
      <a href="#title" class="checkbox small light title">\
      <span class="check"></span>\
      title?\
      </a>\
      <a href="#switch" class="switch">\
      <span class="handle"></span>\
      </a>\
      </div>'),

      initialize: function() {
        this.fieldName = this.options.field;
        this.position  = this.options.position;

        this.model.bind('change:fields', this.fieldChange, this);
        this.add_related_model(this.model);
      },

      fieldChange: function() {

        if(this.model.containsField(this.fieldName)) {
          this.$('.switch').removeClass('disabled').addClass('enabled');
        } else {
          this.$('.switch').removeClass('enabled').addClass('disabled');
        }

        // title
        var t = this.model.getFieldProperty(this.fieldName, 'title');

        if(t) {
          this.$('.title').removeClass('disabled').addClass('enabled');
        } else {
          this.$('.title').removeClass('enabled').addClass('disabled');
        }

      },

      toggle: function(e) {
        e.preventDefault();

        if (!this.model.containsField(this.fieldName)) {
          this.model.addField(this.fieldName, this.position);
        } else {
          this.model.removeField(this.fieldName);
        }

        return false;
      },

      toggleTitle: function(e) {
        e.preventDefault();
        var t = this.model.getFieldProperty(this.fieldName, 'title');
        this.model.setFieldProperty(this.fieldName, 'title', !t);
        return false;
      },

      render: function() {
        this.$el.append(this.template(this));
        this.fieldChange();
        this.$el.attr('cid', this.cid);
        this.$el.addClass('drag_field');

        return this;
      }

  });


  cdb.admin.mod.InfowindowBasePane = cdb.core.View.extend({

    _onResetClick: function(e) {

      e.preventDefault();
      e.stopPropagation();

      this.model.set("custom_html", "");

    },

    _toggleContent: function() {

      if (this.model.get("custom_html")) {
        this.$el.find(".content").hide();
        this.$el.find(".blocked").show();
      } else {
        this.$el.find(".content").show();
        this.$el.find(".blocked").hide();
      }

    }

  });

  /*
   *
   * Default infowindow pane: allows toggling titles
   *
   * */
  cdb.admin.mod.InfowindowPane = cdb.admin.mod.InfowindowBasePane.extend({

    events: {
      'click .selectall': '_manageAll',
      "click .reset": "_onResetClick"
    },

    initialize: function() {

      this.model.bind('remove:fields', this.renderSelectAll, this);
      this.model.bind('add:fields', this.renderSelectAll, this);

      this.add_related_model(this.model);
      this.add_related_model(this.options.table);

      this.model.bind("change:custom_html", this._toggleContent, this);

      this._setupTemplate();
      this.render();

    },

    _setupTemplate: function() {

      this.template = this.getTemplate("table/views/infowindows/infowindow_fields_pane");

    },

    // column names to be rendered
    getColumnNames: function() {
      var self = this;
      var names = this.options.table.columnNames();
      return _(names).filter(function(c) {
        return !_.contains(self.model.SYSTEM_COLUMNS, c);
      });
    },

    renderSelectAll: function() {
      var select_all = true
        , self = this;
      _(this.getColumnNames()).each(function(f) {
        if (!self.model.containsField(f)) {
          select_all = false;
        }
      });

      this.selectedAll = select_all;

      this._changeSelectAll();
    },

    _changeSelectAll: function() {

      if (!this.working) {

        this.$selectAll.removeClass("working");

        if (!this.selectedAll) {
          this.$selectAll.addClass("disabled").removeClass("enabled");
        } else {
          this.$selectAll.addClass("enabled").removeClass("disabled");
        }

      } else {
        this.$selectAll.addClass("enabled working");
      }
    },

    _manageAll: function(e) {

      var self = this;
      this.killEvent(e);

      if (this.working) return;

      self.model.clearFields();

      if (!self.selectedAll) self._selectAll();
      else self._unselectAll();

    },

    _selectAll: function() {
      var self = this;

      var
      names    = this.getColumnNames(),
      count    = _.size(names) - 1,
      promises = [];

      _(names).each(function(f) {
        self.working = true;
        promises.push(self.model._addField(f));
      });

      $.when.apply($, promises).then(function() {

        self.working = false;
        self.model.sortFields();
        self.model.trigger('change:fields');

        self._toggleSelectAll();

      });

    },

    _unselectAll: function() {

      this.model.trigger('change:fields');
      this._toggleSelectAll();
    },

    _toggleSelectAll: function() {
      this.selectedAll = !this.selectedAll;
      this._changeSelectAll();
    },

    renderFields: function() {
      var self = this;
      var $f = this.$('.fields');

      var names = this.getColumnNames();

      names.sort(function(a, b) {
        var pos_a = self.model.getFieldPos(a, 'position');
        var pos_b = self.model.getFieldPos(b, 'position');
        return pos_a - pos_b;
      });

      _(names).each(function(f) {
        var v = new Field({ model: self.model,  field: f , position: self.model.getFieldPos(f) });
        self.addView(v);
        $f.append(v.render().el);
      });

      // Sorteable list, except theme field!
      $f.sortable({
        items: 'li',
        handle: 'span.ellipsis',
        stop: function(ev, ui) {
          self._reasignPositions();
        }
      });
    },

    // when fields are sorted in the iu we should recalculate all models positions
    _reasignPositions: function() {
      var self = this;
      this.$el.find('.drag_field').each(function(i, el) {
        var v = self._subviews[$(el).attr('cid')];
        v.model.setFieldProperty(v.fieldName, 'position', i);
        v.position = i;
      });

    },

    render: function() {
      this.clearSubViews();

      this.$el.html(this.template);
      this._toggleContent();

      this.$el.find('.fields').sortable("destroy")
      this.renderFields();
      this.$selectAll = this.$el.find(".selectall");
      this.renderSelectAll();

      return this;
    }

  });

  cdb.admin.mod.InfowindowTitlePane = cdb.admin.mod.InfowindowBasePane.extend({

    className: "titlePane",

    events: {

      "click .reset": "_onResetClick"

    },

    initialize: function() {

      this._setupModel();
      this._setupTemplate();
      this.render();

    },

    _setupModel: function() {

      this.add_related_model(this.model);
      this.add_related_model(this.options.table);

      this.model.bind("change:fields", this.render, this);
      this.model.bind("change:custom_html", this._toggleContent, this);

    },

    _setupTemplate: function() {
      this.template = this.getTemplate("table/views/infowindows/infowindow_title_pane");
    },

    // column names to be rendered
    getColumnNames: function() {
      var self = this;
      var names = this.options.table.columnNames();
      return _(names).filter(function(c) {
        return !_.contains(self.model.SYSTEM_COLUMNS, c);
      });
    },

    renderFields: function() {
      var self = this;
      var $f = this.$('.fields');

      var names = this.getColumnNames();

      names.sort(function(a, b) {
        var pos_a = self.model.getFieldPos(a, 'position');
        var pos_b = self.model.getFieldPos(b, 'position');
        return pos_a - pos_b;
      });

      _(names).each(function(f) {
        var v = new FieldItem({ model: self.model,  field: f , position: self.model.getFieldPos(f) });
        self.addView(v);
        $f.append(v.render().el);
      });

    },

    render: function() {
      this.clearSubViews();

      this.$el.html(this.template);
      this._toggleContent();

      this.renderFields();

      return this;
    }

  });


  cdb.admin.mod.InfowindowHTMLPane = cdb.admin.mod.InfowindowBasePane.extend({

    _DEFAULT_TEMPLATE: "<!-- You can use the names of your fields:\n\n{{name}}, {{ description }},...\n\n-->",

    events: {

      'click .apply': '_apply',
      'keyup textarea': '_onKeyUp'

    },

    initialize: function() {

      this._setupTemplate();
      this.render();

      this.add_related_model(this.model);
      this.model.bind("change:custom_html", this._onChangeContent, this);

    },

    _onChangeContent: function() {

      var customHTML = this.model.get("custom_html");

      if (customHTML) {
        this.codeEditor.setOption("mode", "text/x-carto");
        this.codeEditor.setValue(customHTML);
      } else {
        this.codeEditor.setValue(this._DEFAULT_TEMPLATE);
        this.codeEditor.setOption("mode", "text");
      }

    },

    _onKeyUp: function() {

      if (this.codeEditor.getValue().length > 0) {
        this.$el.find(".apply").removeClass("disabled");
        this.codeEditor.setOption("mode", "text/x-carto");
      }

    },

    _setupTemplate: function() {

      this.template = this.getTemplate("table/views/infowindows/infowindow_html_pane");

    },

    _apply: function(e) {

      e.preventDefault();
      e.stopPropagation();

      var html = this.codeEditor.getValue();

      this.model.set("custom_html", html);

    },

    render: function() {
      this.clearSubViews();
      this.$el.html(this.template);

      var mode = "text";

      if (this.model.get("custom_html")) {
        text = this.model.get("custom_html");
        mode = "text/x-carto";
      }

      this.codeEditor = CodeMirror.fromTextArea(this.$('textarea')[0], {
        mode: mode,
        tabMode: "indent",
        matchBrackets: true,
        lineNumbers: true,
        lineWrapping: true
      })

      this.codeEditor.setValue(this._DEFAULT_TEMPLATE);

      return this;
    }

  });



  cdb.admin.mod.InfoWindow = cdb.core.View.extend({

    buttonClass: 'infowindow_mod',
    className: 'infowindow_panel',
    type: 'tool',

    events: {
      'click .menu li a': '_toggleTab'
    },

    initialize: function() {
      var self = this;
      this.selectedAll = true;
      this.add_related_model(this.model);
      this.add_related_model(this.options.table);

      this.template = this.getTemplate('table/menu_modules/views/infowindow');
      //this.model.bind('remove:fields', this.renderSelectAll, this);
      //this.model.bind('add:fields', this.renderSelectAll, this);
      this.options.table.bind('change:schema', this.render, this);
      this.options.table.linkToInfowindow(this.model);

    },

    activated: function() {},

    disabled: function() {
      this.model.saveFields();
      this.model.clearFields();
      this.model.set('disabled', true);
    },

    enabled: function() {
      this.model.restoreFields();
      this.model.unset('disabled');
    },

    _toggleTab: function(e) {

      e.preventDefault();
      e.stopPropagation();

      var action = $(e.target).attr("data-action");

      this.$el.find(".menu a").removeClass("selected");
      $(e.target).addClass("selected");
      this.pane.active(action);

    },

    renderThemeCombo: function() {
      var themes = new cdb.forms.Combo({
        property: 'template_name',
        extra: [
          ['light',             'table/views/infowindow_light'],
          ['dark',              'table/views/infowindow_dark'],
          ['header blue',       'table/views/infowindow_light_header_blue'],
          ['header green',      'table/views/infowindow_light_header_green'],
          ['header yellow',     'table/views/infowindow_light_header_yellow'],
          ['header orange',     'table/views/infowindow_light_header_orange'],
          ['image header',      'table/views/infowindow_header_with_image']
        ],
        model: this.model
      });

      this.$('.header').append(themes.render().el);

      this.addView(themes);
    },

    _setupTipsy: function() {

      var tipsyOptions = { gravity: 's', html: true, live: true, fade: true, title: function() { return $(this).attr("data-tipsy") }};

      this.$el.find(".menu a[data-action='tab1'], .menu a[data-action='tab2']").tipsy(tipsyOptions);

      tipsyOptions.gravity = 'se';

      this.$el.find(".menu a[data-action='tab3']").tipsy(tipsyOptions);

    },

    _setupPane: function() {

      this._setupTipsy();

      this.pane = new cdb.ui.common.TabPane({
        el: this.$el.find(".pane")
      });

      this.pane.addTab('tab1', new cdb.admin.mod.InfowindowPane({
        table: this.options.table,
        model: this.model
      }));

      this.pane.addTab('tab2', new cdb.admin.mod.InfowindowTitlePane({
        table: this.options.table,
        model: this.model
      }));


      this.pane.addTab('tab3', new cdb.admin.mod.InfowindowHTMLPane({
        table: this.options.table,
        model: this.model
      }));

      var self = this;

      this.pane.bind('tabEnabled', function(tabName, tabView) {

        if (tabName == 'tab3') {
          self.$el.find(".form_combo").hide();
        } else {
          self.$el.find(".form_combo").show();
        }

        if (tabName == 'tab3') {
          //self.$el.find(".help").show();
        } else {
          //self.$el.find(".hide").show();
        }

        if (tabName == 'tab1') {
          self.$el.find(".header h3").text("Design");
        } else if (tabName == 'tab2') {
          self.$el.find(".header h3").text("Design");
        } else if (tabName == 'tab3') {
          self.$el.find(".header h3").text("Custom HTML");
        }

        if (tabName == 'tab3') {
          if (tabView.codeEditor) tabView.codeEditor.refresh();
          self.$el.addClass('editing_html');

        } else {
          self.$el.removeClass('editing_html');
        }

        var left = self.$el.find(".menu li a[data-action="+tabName+"]").parent().position().left;
        if (tabName == 'tab3') left += 4;
        self.$el.find(".menu .tip").css({ left: left });

      });

      this.pane.active('tab1');

    },

    render: function() {

      this.clearSubViews();
      this.$el.html(this.template({}));

      this.renderThemeCombo();
      this._setupPane();

      this.$el.find(".menu .tip").css({ left: 30 });

      // Remove old custom scroll
      if (this.custom_scroll) {
        this.removeView(this.custom_scroll);
        this.custom_scroll.clean();
      }

      // Create custom scroll
      this.custom_scroll = new cdb.admin.CustomScrolls({
        el:     this.$el.find(".panel_content div.wrapper"),
        parent: this.$el.find(".panel_content")
      });

      this.addView(this.custom_scroll);

      return this;

    }

  });
})();
