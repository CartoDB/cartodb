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
    '<%- fieldName %>\
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
      'click .selectall': '_selectAll',
      'click .unselect': '_unselectAll'

    },

    initialize: function() {
      this.template = this.getTemplate('table/menu_modules/views/infowindow');
      //this.model.bind('change:fields', this.renderFields, this);
      this.options.table.bind('change:schema', this.renderFields, this);
      this.options.table.linkToInfowindow(this.model);
    },

    activated: function() {
    },

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
        property: 'template',
        extra: ['light', 'rambo', 'wadus'],
        model: this.model
      });
      var $f = this.$('.fields');
      var li = $('<li>').append('Theme');
      li.append(themes.render().el);
      $f.append(li);
      this.addView(themes);
    },

    render: function() {
      this.clearSubViews();
      this.$el.append(this.template({}));
      this.renderThemeCombo();
      this.renderFields();
      return this;
    },

    _selectAll: function(e) {
      var self = this;
      e.preventDefault();
      _(this.options.table.columnNames()).each(function(f) {
        self.model.addField(f);
      });
      return 0;
    },

    _unselectAll: function(e) {
      var self = this;
      e.preventDefault();
      _(this.options.table.columnNames()).each(function(f) {
        self.model.removeField(f);
      });
      return 0;
    }

});


})();
