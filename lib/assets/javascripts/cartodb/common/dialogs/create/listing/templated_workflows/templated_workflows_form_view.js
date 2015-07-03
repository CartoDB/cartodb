var cdb = require('cartodb.js');
var TemplatedWorkflowsFormModel = require('./templated_workflows_form_model');


/**
 *  It will render a form given fields
 *
 *  new TemplatedWorkflowFormView({
 *    form_data: [
 *      {
 *         name: 'City fill',
 *         form: {
 *           'city-fill': {
 *              type: 'color',
 *              value: '#00FF00'
 *            },
 *            'roads-opacity': {
 *              type: 'opacity',
 *              value: 0.6
 *            }
 *          },
 *          validate: function(attrs) {
 *            if (!attrs) return;
 *            
 *            if (!attrs['city-fill']) {
 *              return 'City fill value is needed'
 *            }
 *          }
 *        }
 *      }
 *    ]
 *  });
 */


module.exports = cdb.core.View.extend({
  
  tagName: 'div',
  className: 'Form TemplatedWorkflows-Form u-inner',

  _WIDGETS: {
   'color': 'ColorWizard',
   'number': 'Spinner',
   'select': 'Combo',
   'hidden': 'Hidden',
   'switch': 'Switch'
  },

  _FIELD_TEMPLATE: 'common/dialogs/create/listing/templated_workflows/templated_workflows_form_field',

  initialize: function() {
    this.fields = {};
    this.form_data = this.options.form_data;
    this._initBinds();
  },

  render: function() {
    var self = this;
    this.clearSubViews();
    
    _(this.filter).each(function(e) {
      e.destroy();
    });
    
    this.$el.html('');
    _(this.form_data).each(function(field) {
      var f = self._renderField(field);
      self.fields[field.name] = f;
      self.$el.append(f);
    });

    return this;
  },

  _initBinds: function() {
    this.bind('clean', function() {
      delete this.fields;
    }, this);
    // If form model changes, let's trigger
    // that change
    this.model.bind('change', function() {
      this.trigger('onChange', this.model.toJSON(), this);
    }, this);
  },

  updateForm: function(form) {
    this.form_data = form;
  },

  _renderField: function(field) {
    var self = this;
    var template = cdb.templates.getTemplate(this._FIELD_TEMPLATE);
    var $el = $('<div>');

    _(field.form).each(function(form, name) {
      var $field = $(template({ name: field.title || field.name, className: field.className || false }));

      // create the class for this data type and add it to view
      var Class = window.cdb.forms[self._WIDGETS[form.type]];

      if (Class) {
        var opts = form;
        _.extend(opts, {
          property: name,
          model: self.model,
          extra: form.extra,
          field_name: field.name
        });
        var v = new Class(opts);
        $field.find('.js-field').append(v.render().el);

        // ????
        // v.on("saved", function() {
        //   self.trigger("saved", self);
        // });

        $el.append($field);
        self.addView(v);
      } else {
        cdb.log.error("Templated workflows form " + form.type + " class not found or specified");
      }
    });

    return $el;
  },

  /**
   * return the jquery element for a field
   * (wraps each subfield)
   */
  getFieldByName: function(name) {
    return this.fields[name];
  },

  // Returns the views inside each field
  getFieldsByName: function(name) {
    return _.filter(this._subviews, function(v) {
      if(v.options.field_name === name) {
        return v;
      }
    });
  }

});

