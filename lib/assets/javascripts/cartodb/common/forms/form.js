
/**
 * renders a form given fields
 *
 * var form = new cdb.forms.Form({
 *  form_data: [
      {
         name: 'Marker Fill',
         form: {
           'polygon-fill': {
                 type: 'color' ,
                 value: '#00FF00'
            },
            'polygon-opacity': {
                 type: 'opacity' ,
                 value: 0.6
            }
        }
      }
    ]
 * });
 */

cdb.forms.Form = cdb.core.View.extend({
  tagName: 'ul',

  widgets: {
   'color': 'Color',
   'opacity': 'Opacity',
   'number': 'Spinner',
   'width': 'Width',
   'select': 'Combo',
   'hidden': 'Hidden'
  },

  field_template: _.template('<li><span><%=name %></span><span class="field"></li>'),

  initialize: function() {
    var self = this;
    this.form_data = this.options.form_data;

    var default_data = {};
    _(this.form_data).each(function(field) {
      _(field.form).each(function(v, k) {
        default_data[k] =  v.value;
      });
    });
    this.model.set(default_data);
  },

  _renderField: function(field) {
    var self = this;
    var e = $(this.field_template({ name: field.title || field.name }));
    _(field.form).each(function(form, name) {

      // create the class for this data type and add it to view
      var Class = window.cdb.forms[self.widgets[form.type]];
      if (Class) {
        var v = new Class({
          property: name,
          model: self.model,
          extra: form.extra
        });
        e.find('.field').append(v.render().el);
        self.addView(v);
      } else {
        cdb.log.error("field class not found "  + form.type);
      }
    });

    // Render text if it exists after first form
    // TODO: create a new type of field called text
    if (field.text) {
      $("<span class='text light'>" + field.text + "</span>").insertAfter(e.find('.field div:eq(0)'));
    }

    return e;
  },

  render: function() {
    var self = this;
    this.clearSubViews();
    this.$el.html('');
    _(this.form_data).each(function(field) {
      self.$el.append(self._renderField(field));
    });
    return this;
  }

});

