
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
   'color': 'ColorWizard',
   'opacity': 'Opacity',
   'simple_opacity': 'SimpleOpacity',
   'opacity_polygon': 'OpacityPolygon',
   'number': 'Spinner',
   'simple_number': 'SimpleNumber',
   'simple_number_with_label': 'SimpleNumberWithLabel',
   'width': 'Width',
   'select': 'Combo',
   'hidden': 'Hidden',
   'switch': 'Switch',
   'text_align': 'TextAlign'
  },

  field_template: _.template('<li <% if (className) { %>class="<%- className %>"<% } %>><span><%-name %></span><span class="field"></li>'),

  initialize: function() {
    var self = this;
    this.fields = {};

    this.form_data = this.options.form_data;

    this.bind('clean', function() {
      this.fields = null;
    }, this);
  },

  updateForm: function(form) {
    this.form_data = form;
  },

  _renderField: function(field) {
    var self = this;
    var e = $(this.field_template({ name: field.title || field.name, className: field.className || false }));
    _(field.form).each(function(form, name) {

      // create the class for this data type and add it to view
      var Class = window.cdb.forms[self.widgets[form.type]];
      if (Class) {
        var opts = form;
        _.extend(opts, {
          property: name,
          model: self.model,
          extra: form.extra,
          field_name: field.name
        });
        var v = new Class(opts);
        e.find('.field').append(v.render().el);

        v.on("saved", function() {
          self.trigger("saved", self);
        });

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

  /**
   * return the jquery element for a field
   * (wraps each subfield)
   */
  getFieldByName: function(name) {
    return this.fields[name];
  },

  /**
   * returns the views inside each field
   */
  getFieldsByName: function(name) {
    return _.filter(this._subviews, function(v) {
      if(v.options.field_name === name) {
        return v;
      }
    });
  },

  render: function() {
    var self = this;
    this.clearSubViews();
    _(this.filter).each(function(e) {
      e.destroy();
    });
    this.$el.html('');
    _(this.form_data).each(function(field) {
      var f= self._renderField(field);
      self.fields[field.name] = f;

      self.$el.append(f);
    });
    return this;
  }

});

