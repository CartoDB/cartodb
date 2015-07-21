var cdb = require('cartodb.js');
var WorkflowStepFieldModel = require('./workflow_step_field_model');
var DatesRangePicker = require('../../../../views/date_pickers/dates_range_picker');
var TwitterCreditsUsage = require('../imports/twitter_import/credits_usage_view.js');
var TwitterCategoryView = require('./widgets/twitter_category_view');

/**
 *  It will render a form given fields
 *
 *  new TemplatedWorkflowFormView({
 *    user: UserModel, // Needed for some views
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
 *    ],
 *    collection: WorkflowStepFormCollection
 *  });
 */
module.exports = cdb.core.View.extend({
  
  tagName: 'div',
  className: 'Form TemplatedWorkflows-Form u-inner',

  _WIDGETS: {
    'twitter_category': TwitterCategoryView,
    'color': window.cdb.forms.Color,
    'date_range': DatesRangePicker,
    'twitter_credits_usage': TwitterCreditsUsage
  },

  _FIELD_TEMPLATE: 'common/dialogs/create/listing/templated_workflows/templated_workflows_form_field',

  initialize: function() {
    this.user = this.options.user;
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

    return this;
  },

  _initBinds: function() {
    this.bind('clean', function() {
      delete this._fields;
    }, this);
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
      var WidgetClass = self._WIDGETS[form.type];

      // create the model needed for the widget
      var attrs = {
        name: form.value || ''
      };
      var model = new WorkflowStepFieldModel(attrs);

      // and add the validation if it exists
      if (form.validate) {
        _.extend(model, { validate: form.validate });
      }

      if (WidgetClass) {
        var opts = form;
        _.extend(opts, {
          property: name,
          model: model,
          user: self.user,
          extra: form.extra,
          field_name: field.name
        });
        var widgetView = new WidgetClass(opts);
        $el.find('.js-field').append(widgetView.render().el);

        // Adds the field to the collection of fields
        self.collection.add(model);
        self.addView(widgetView);
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

