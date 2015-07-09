var cdb = require('cartodb.js');
var WorkflowStepFieldModel = require('./workflow_step_field_model');
var Combo = require('./templated_workflows_combo_widget_view');


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
   'select': Combo
  },

  _FIELD_TEMPLATE: 'common/dialogs/create/listing/templated_workflows/templated_workflows_form_field',

  initialize: function() {
    this._fields = {};
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
      self._fields[field.name] = f;
      self.$el.append(f);
    });

    // this._renderFormError();

    return this;
  },

  _initBinds: function() {
    this.bind('clean', function() {
      delete this._fields;
    }, this);
    // this.collection.bind('change', this._setErrorField, this);
  },

  updateForm: function(form) {
    this.form_data = form;
  },

  _renderField: function(field) {
    var self = this;
    var template = cdb.templates.getTemplate(this._FIELD_TEMPLATE);
    var $el = $(template({ name: field.title || field.name }));

    _(field.form).each(function(form, name) {

      // create the class for this data type and add it to view
      var Class = self._WIDGETS[form.type];
      // create the model needed for the widget
      var attrs = {};
      attrs[name] = form.value || '';
      var model = new WorkflowStepFieldModel(attrs);

      // and add the validation if it exists
      if (form.validate) {
        _.extend(model, { validate: form.validate });
      }

      if (Class) {
        var opts = form;
        _.extend(opts, {
          property: name,
          model: model,
          extra: form.extra,
          field_name: field.name
        });
        var v = new Class(opts);
        $el.find('.js-field').append(v.render().el);

        self.collection.add(model);
        self.addView(v);
      } else {
        cdb.log.error("Templated workflows form " + form.type + " class not found or specified");
      }
    });

    return $el;
  },

  // _renderFormError: function() {
  //   this.$el.prepend($('<div>').addClass('js-formError'));
  // },

  // _setErrorField: function() {
  //   var $el = this.$('.js-formError');
  //   var error = this.collection.getError();
  //   if (error) {
  //     $el
  //       .text(error)
  //       .show();
  //   } else {
  //     $el.hide();
  //   }
  // },

  /**
   * return the jquery element for a field
   * (wraps each subfield)
   */
  getFieldByName: function(name) {
    return this._fields[name];
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

