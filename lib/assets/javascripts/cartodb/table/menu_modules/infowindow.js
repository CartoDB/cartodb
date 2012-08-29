/**
 * info window module, allow to edit the infowindow appearance
 * and the fields that will be shown
 */

cdb.admin.mod = cdb.admin.mod || {};

(function() {

var Field = cdb.core.View.extend({

  tagName: 'li',

  events: {
    'click .switch': 'toggle',
    'click .title': 'toggleTitle'
  },

  template: _.template(
    '<span><%- fieldName %></span>\
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
    this.model.bind('change:fields', this.fieldChange, this);
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
    if(!this.model.containsField(this.fieldName)) {
      this.model.addField(this.fieldName);
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
    return this;
  }

});

cdb.admin.mod.InfoWindow = cdb.core.View.extend({

    buttonClass: 'infowindow_mod',
    className: 'infowindow_panel',
    type: 'tool',

    events: {
      'click .selectall': '_manageAll'
    },

    initialize: function() {
      this.selectedAll = true;

      this.template = this.getTemplate('table/menu_modules/views/infowindow');
      this.model.bind('change:fields', this.renderSelectAll, this);
      this.options.table.bind('change:schema', this.renderFields, this);
      this.options.table.linkToInfowindow(this.model);
    },

    activated: function() {},

    renderFields: function() {
      var self = this;
      var $f = this.$('.fields');
      _(this.options.table.columnNames()).each(function(f) {
        var v = new Field({model: self.model,  field: f });
        self.addView(v);
        $f.append(v.render().el);
      });
    },

    renderThemeCombo: function() {
      var themes = new cdb.forms.Combo({
        property: 'template_name',
        extra: [
          ['light', 'table/views/infowindow_light'],
          ['header', 'table/views/infowindow_light_header']
        ],
        model: this.model
      });
      var $f = this.$('.fields');
      var li = $('<li>');
      li
        .append(themes.render().el)
        .append('<span>Theme</span>');
      $f.append(li);
      this.addView(themes);
    },

    renderSelectAll: function() {
      var select_all = true
        , self = this;

      _(this.options.table.columnNames()).each(function(f) {
        if (!self.model.containsField(f)) {
          select_all = false;
        }
      });

      this.selectedAll = select_all;

      this._changeSelectAll();
    },

    render: function() {
      this.clearSubViews();
      this.$el.append(this.template({}));
      this.renderThemeCombo();
      this.renderFields();
      this.$selectAll = this.$el.find(".selectall");
      this.renderSelectAll();
      return this;
    },

    _manageAll: function(e) {
      var self = this;
      e.preventDefault();

      // Unbind the change of the fields to prevent issues
      this.model.unbind('change:fields', this.renderSelectAll, this);

      _(this.options.table.columnNames()).each(function(f) {
        if (self.selectedAll) {
          self.model.removeField(f);
        } else {
          self.model.addField(f);
        }
      });

      // Bind again to field changes
      this.model.bind('change:fields', this.renderSelectAll, this);

      // Change select all
      this.selectedAll = !this.selectedAll;

      // Change select switch
      this._changeSelectAll();

      return 0;
    },

    _changeSelectAll: function() {
      if (!this.selectedAll) {
        this.$selectAll.addClass("disabled").removeClass("enabled");
      } else {
        this.$selectAll.addClass("enabled").removeClass("disabled");
      }
    }
});


})();
