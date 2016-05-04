var cdb = require('cartodb.js')
var template = require('./infowindow-field.tpl')

/**
 * View for an individual column model.
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'js-field',

  events: {
    'click .js-checkbox': 'toggle',
    'keyup input': '_onKeyUp',
    'blur input': '_onBlur'
  },

  initialize: function (opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');

    this._layerInfowindowModel = opts.layerInfowindowModel;

    this.fieldName = opts.field.name
    this.fieldTitle = opts.field.title
    this.position = opts.position

    this.model = new cdb.core.Model({ title: this._layerInfowindowModel.getAlternativeName(this.fieldName) || this.fieldName })

    this._layerInfowindowModel.bind('change:fields', this.render, this);
    // this.model.bind('change:title', this._updateValue, this);
  },

  _onBlur: function (e) {
    console.log('blur')
  },

  _onKeyUp: function (e) {
    console.log('up')
  },

  // _onBlur: function(e) {
  //   var value = this.$el.find('input').val();
  //   value = cdb.Utils.stripHTML(value);

  //   var self = this;

  //   this.fieldModel.bind("change:title", function() {
  //     self.model.setAlternativeName(self.fieldName, this.get("title"));
  //   });
  // },

  // _onKeyUp: function(e) {
  //   if (e.keyCode == 13) { // Enter

  //     var value = this.$el.find("input").val();

  //     if (this.stripHTML) {
  //       value = cdb.Utils.stripHTML(value);
  //     }

  //     this.model.set(this._observedField, value);
  //     this._close();

  //   } else if (e.keyCode == 27) { // Esc
  //     this._close();
  //   }
  // },

  // _updateValue: function() {
  //   var value = this.model.get('title');
  //   value = cdb.Utils.stripHTML(value);

  //   this.$input.text(value);
  //   this.$el.find(".value span").html(value);
  //   this.$el.find(".value").removeClass("empty");

  //   this.trigger("change", value, this);
  // },

  // toggleTitle: function() {
  //   var t = this.model.getFieldProperty(this.fieldName, 'title');
  //   this.model.setFieldProperty(this.fieldName, 'title', !t);
  // },

  render: function () {
    this.$el.html(template({
      name: this.fieldName,
      title: this.fieldTitle,
      alternativeName: this._layerInfowindowModel.getAlternativeName(this.fieldName),
      disabled: !this.fieldTitle,
      isSelected: !!this._layerInfowindowModel.containsField(this.fieldName)
    }))
    this.$el.attr('data-view-cid', this.cid)

    return this
  },

  toggle: function(e) {
    e.preventDefault();

    if (!this._layerInfowindowModel.containsField(this.fieldName)) {
      this._layerInfowindowModel.addField(this.fieldName, this.position);
    } else {
      this._layerInfowindowModel.removeField(this.fieldName);
    }

    return false;
  }

})