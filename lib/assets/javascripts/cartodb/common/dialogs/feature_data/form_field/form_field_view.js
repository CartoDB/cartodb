var cdb = require('cartodb.js-v3');
var StringFieldView = require('../../../edit_fields/string_field/string_field_view');
var NumberFieldView = require('../../../edit_fields/number_field/number_field_view');
var BooleanFieldView = require('../../../edit_fields/boolean_field/boolean_field_view');
var DateFieldView = require('../../../edit_fields/date_field/date_field_view');

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
    'date': DateFieldView,
    'timestamp with time zone': DateFieldView,
    'timestamp without time zone': DateFieldView
  },

  initialize: function() {
    this.model = new cdb.core.Model({
      columnError: '',
      typeError: '',
      fieldError: ''
    });
    this.table = this.options.table;
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
        typeError: this.model.get('typeError'),
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
    // Current value has to be available in the extra array,
    // if not select will place first item as value
    var types = [this.fieldModel.get('type')].concat(_.filter(['string', 'boolean', 'number', 'date'], function(type){
      return self.table.isTypeChangeAllowed(self.fieldModel.get('attribute'), type)
    }));
    var combo = new cdb.forms.Combo({
      el: this.$('.js-fieldType'),
      model: this.fieldModel,
      property: 'type',
      disabled: this.fieldModel.get('readOnly'),
      width: '85px',
      extra: types
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
        return self.model.get('typeError')
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

    this.model.set('typeError', '');

    // Readonly everything
    this.fieldModel.set('readOnly', true);

    this.table.changeColumnType(this.fieldModel.get('attribute'), this.fieldModel.get('type'), {
      success: function() {
        // refresh record data after change
        // readOnly to false
        self._refreshRecordData(function() {
          self.fieldModel.set('readOnly', false);
        })
      },
      error: function() {
        // Avoiding silent:true and the event trigger
        // when other attribute is changed
        self.fieldModel.attributes.readOnly = false;
        self.fieldModel.attributes.value = previousValue;
        self.fieldModel.attributes.type = previousType;

        try {
          var msg = JSON.parse(e.responseText).errors[0];
          self.model.set('typeError', msg);
        } catch (e) {}
        self.render();
      }
    });
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

      this.table.renameColumn(oldVal, val, {
        success: function(mdl, data) {
          self.model.set('columnError', '');
          self.fieldModel.set({
            attribute: data.name,
            readOnly: false
          });
        },
        error: function(mdl, err) {
          try {
            var msg = JSON.parse(err.responseText).errors[0];
            self.model.set('columnError', msg);
          } catch (e) {}
          self.fieldModel.set({
            attribute: oldVal,
            readOnly: false
          });
        }
      });
    }
  },

  _refreshRecordData: function(onComplete) {
    var self = this;

    this.row.fetch({
      success: function(r) {
        var newValue = r && r.rows[0] && r.rows[0][self.fieldModel.get('attribute')];
        self.fieldModel.set('value', newValue);
        onComplete && onComplete();
      },
      error: function() {
        onComplete && onComplete();
      }
    })
  },
  
});