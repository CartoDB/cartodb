/**
 * info window module, allow to edit the infowindow appearance
 * and the fields that will be shown
 */

cdb.admin.mod = cdb.admin.mod || {};

(function() {

var Field = cdb.core.View.extend({

  tagName: 'li',

  events: {
    'click': 'toggle'
  },
  
  template: _.template('<a href="#"><%- fieldName %></a><span class="switch"></span>'),

  initialize: function() {
    this.fieldName = this.options.field;
    this.model.bind('change:fields', this.fieldChange, this);
  },

  fieldChange: function() {
    if(_.include(this.model.get('fields'), this.fieldName)) {
      this.$el.removeClass('disabled').addClass('enabled');
    } else {
      this.$el.removeClass('enabled').addClass('disabled');
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

  render: function() {
    this.$el.append(this.template(this));
    this.fieldChange();
    return this;
  }


});

cdb.admin.mod.InfoWindow = cdb.core.View.extend({

    buttonClass: 'infowindow_mod',
    type: 'tool',

    events: {
    },

    initialize: function() {
      this.template = this.getTemplate('table/menu_modules/views/infowindow');
      this.model.bind('change:fields', this.renderFields, this);
    },

    activated: function() {
    },

    renderFields: function() {
      var self = this;
      this.clearSubViews();
      var $f = this.$('.fields');
      _(this.model.get('fields')).each(function(f) {
        var v = new Field({model: self.model,  field: f });
        self.addView(v);
        $f.append(v.render().el);
      });
    },

    render: function() {
      this.$el.append(this.template({}));
      this.renderFields();
      return this;
    }

});


})();
