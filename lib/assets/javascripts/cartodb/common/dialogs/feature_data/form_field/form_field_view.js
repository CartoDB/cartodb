var cdb = require('cartodb.js');
var StringFieldView = require('../../../edit_fields/string_field/string_field_view');
var NumberFieldView = require('../../../edit_fields/number_field/number_field_view');
var BooleanFieldView = require('../../../edit_fields/boolean_field/boolean_field_view');

/**
 *  Form field view for edit feature metadata
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'keydown .js-columnName': '_onInputChange',
    'focusout .js-columnName': '_onColNameChange',
  },

  _FIELD_VIEW: {
    'string': StringFieldView,
    'number': NumberFieldView,
    'boolean': BooleanFieldView,
    'date': cdb.admin.DateField,
    'timestamp with time zone': cdb.admin.DateField,
    'timestamp without time zone': cdb.admin.DateField
  },

  initialize: function() {
    this.model = new cdb.core.Model({
      columnError: '',
      typeError: '',
      fieldError: ''
    });
    this.column = this.options.column;
    this.row = this.options.row;
    this.fieldModel = this.options.fieldModel;
    this.template = cdb.templates.getTemplate('common/dialogs/feature_data/form_field/form_field');
    this._initBinds();
  },

  render: function() {
    this.clearSubViews();
    this.$el.html(
      this.template({
        type: this.fieldModel.get('type'),
        value: this.fieldModel.get('value'),
        attribute: this.fieldModel.get('attribute'),
        readOnly: this.fieldModel.get('readOnly'),
        columnError: this.model.get('columnError')
      })
    );
    this._initViews();
    return this;
  },

  _initBinds: function() {
    this.fieldModel.bind('change:readOnly', this.render, this);
    this.fieldModel.bind('change:type', this._onTypeChanged, this);
    this.add_related_model(this.fieldModel);
  },

  _initViews: function() {
    var self = this;

    // Field view
    var editorField = this._FIELD_VIEW[this.fieldModel.get('type')] || this._FIELD_VIEW['string'];
    var v = new editorField({
      readOnly: this.fieldModel.get('readOnly'),
      model: this.fieldModel
    }).bind('onSubmit', function(e) {
      this.trigger('onSubmit');
    }, this);

    this.$('.js-editField').append(v.render().el);
    this.addView(v);

    // Field tooltip
    var fieldTooltip = new cdb.common.TipsyTooltip({
      el: this.$('.js-editField'),
      title: function() {
        return self.fieldModel.getError()
      }
    });
    this.addView(fieldTooltip);

    // Column type combo
    var combo = new cdb.forms.Combo({
      el: this.$('.js-fieldType'),
      model: this.fieldModel,
      property: 'type',
      disabled: this.fieldModel.get('readOnly'),
      width: '85px',
      extra: ['string', 'boolean', 'number', 'date']
    });

    this.$(".js-fieldType").append(combo.render());
    combo.bind('change', function(type) {
      this.fieldModel.set({
        value: null,
        type: type
      })
    }, this);
    this.addView(combo);

    // Column type tooltip
    var typeTooltip = new cdb.common.TipsyTooltip({
      el: this.$('.js-fieldType'),
      title: function() {
        return "" // self.model.get('typeError');
      }
    });
    this.addView(typeTooltip);

    // Column name tooltip
    var typeTooltip = new cdb.common.TipsyTooltip({
      el: this.$('.js-columnName'),
      title: function() {
        return self.model.get('columnError');
      }
    });
    this.addView(typeTooltip);
  },

  _onTypeChanged: function() {
    var self = this;
    var previousType = this.fieldModel.previous('type');
    var previousValue = this.fieldModel.previous('value');

    // Readonly everything
    this.fieldModel.set('readOnly', true);

    // Remove old model "sets"
    this.column.unset('new_name');
    this.column.unset('old_value');

    this.column.save({
      type: this.fieldModel.get('type')
    },{
      success: function() {
        // refresh record data after change
        // readOnly to false
        self._refreshRecordData(
          function() {
            self.fieldModel.set('readOnly', false);
          },
          function() {
            self.fieldModel.set('readOnly', false);
          }
        )
      },
      error: function(mdl) {
        self.fieldModel.set({
          readOnly: false,
          value: previousValue,
          type: previousType
        }, { silent: true });
        self.render();
      }
    })
  },

  _onInputChange: function(ev) {
    if (ev.keyCode === 13) {
      $(ev.target).blur();
      this.killEvent(ev);
    }
  },

  _onColNameChange: function(ev) {
    var self = this;
    var val = $(ev.target).val();
    var oldVal = this.fieldModel.get('attribute');
    
    if (oldVal !== val) {
      this.fieldModel.set({
        attribute: val,
        readOnly: true
      });

      this.column.save({
        old_value: oldVal,
        new_name: val,
        type: this.fieldModel.get('type')
      },{
        error: function(mdl, err) {
          try {
            var msg = JSON.parse(err.responseText).errors[0];
            self.model.set('columnError', msg);
          } catch (e) {}
          self.fieldModel.set({
            attribute: oldVal,
            readOnly: false
          });
        },
        success: function(mdl, data) {
          self.model.set('columnError', '');
          self.fieldModel.set({
            attribute: data.name,
            readOnly: false
          });
        }
      });
    }
  },

  _refreshRecordData: function(successCallback, errorCallback) {
    var self = this;

    this.row.fetch({
      success: function(r) {
        var newValue = r && r.rows[0] && r.rows[0][self.fieldModel.get('attribute')];
        self.fieldModel.set('value', newValue);
        successCallback && successCallback()
      },
      error: function() {
        console.log("show field error :(");
        errorCallback && errorCallback();
      }
    })
  },
  
});