var cdb = require('cartodb.js');
var template = require('./infowindow-select.tpl');
var CarouselFormView = require('../../../../components/carousel-form-view');
var InfowindowFormView = require('./infowindow-form-view');
var _ = require('underscore');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    if (!opts.templatesCollection) throw new Error('templatesCollection is required');
    this._layerInfowindowModel = opts.layerInfowindowModel;
    this._templatesCollection = opts.templatesCollection;
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template());

    this._renderCarousel();
    this._renderForm();

    return this;
  },

  _checkValidTemplate: function () {
    var template = this._templatesCollection.find(function (mdl) {
      return this._layerInfowindowModel.get('template_name') === mdl.get('val');
    }, this);

    return template && template.get('val') !== '';
  },

  _setNoneTemplate: function () {
    var noneTemplate = this._templatesCollection.find(function (mdl) {
      return mdl.get('val') === '';
    }, this);

    noneTemplate.set('selected', true);
  },

  _getModelTemplate: function () {
    return this.model.get('template_name');
  },

  _fieldsToString: function (fields, template_name) {
    var fields_sanitized = [];
    if (fields && fields.length > 0) {
      var self = this;
      fields_sanitized = _.map(fields, function (field, i) {
        // Return whole attribute sanitized
        return self._sanitizeField(field, template_name, field.index || i);
      });
    }
    return fields_sanitized;
  },

  _compileTemplate: function (template_name) {
    var template = cdb.templates.getTemplate(template_name);

    // Clone fields and template name
    var fields = _.map(this._layerInfowindowModel.attributes.content.fields, function (field) {
      return _.clone(field);
    });
    var data = this.model.get('content') ? this.model.get('content').data : {};

    // If a custom template is not applied, let's sanitized
    // fields for the template rendering
    if (template_name) {
      // Sanitized them
      fields = this._fieldsToString(fields, template_name);
    }

    // Join plan fields values with content to work with
    // custom infowindows and CartoDB infowindows.
    var values = {};
    _.each(this.model.get('content').fields, function (pair) {
      values[pair.title] = pair.value;
    });

    var obj = _.extend({
      content: {
        fields: fields,
        data: data
      }
    }, values);

    debugger;
    return template(obj);
  },

  /**
   *  Sanitize fields, what does it mean?
   *  - If value is null, transform to string
   *  - If value is an url, add it as an attribute
   *  - Cut off title if it is very long (in header or image templates).
   *  - If the value is a valid url, let's make it a link.
   *  - More to come...
   */
  _sanitizeField: function(attr, template_name, pos) {
    // Check null or undefined :| and set both to empty == ''
    if (attr.value == null || attr.value == undefined) {
      attr.value = '';
    }

    //Get the alternative title
    var alternative_name = this.model.getAlternativeName(attr.title);

    if (attr.title && alternative_name) {
      // Alternative title
      attr.title = alternative_name;
    } else if (attr.title) {
      // Remove '_' character from titles
      attr.title = attr.title.replace(/_/g,' ');
    }

    // Cast all values to string due to problems with Mustache 0 number rendering
    var new_value = attr.value.toString();

    // If it is index 0, not any field type, header template type and length bigger than 30... cut off the text!
    if (!attr.type && pos==0 && attr.value.length > 35 && template_name && template_name.search('_header_') != -1) {
      new_value = attr.value.substr(0,32) + "...";
    }

    // If it is index 1, not any field type, header image template type and length bigger than 30... cut off the text!
    if (!attr.type && pos==1 && attr.value.length > 35 && template_name && template_name.search('_header_with_image') != -1) {
      new_value = attr.value.substr(0,32) + "...";
    }

    // Is it the value a link?
    if (this._isValidURL(attr.value)) {
      new_value = "<a href='" + attr.value + "' target='_blank'>" + new_value + "</a>"
    }

    // If it is index 0, not any field type, header image template type... don't cut off the text or add any link!!
    if (pos==0 && template_name.search('_header_with_image') != -1) {
      new_value = attr.value;
    }

    // Save new sanitized value
    attr.value = new_value;

    return attr;
  },

  _renderCarousel: function () {
    if (!this._checkValidTemplate()) {
      this._setNoneTemplate();
    }

    this._templatesCollection.bind('change:selected', function (mdl) {
      if (mdl.get('selected')) {
        var value = mdl.getValue();

        this._layerInfowindowModel.setTemplate(value, this._compileTemplate(value));
      }
    }, this);

    var view = new CarouselFormView({
      collection: this._templatesCollection,
      template: require('./infowindow-carousel.tpl')
    });
    this.addView(view);
    this.$('.js-select').append(view.render().el);
  },

  _renderForm: function () {
    if (this._infowindowFormView) {
      this.removeView(this._infowindowFormView);
      this._infowindowFormView.clean();
    }

    this._infowindowFormView = new InfowindowFormView({
      layerInfowindowModel: this._layerInfowindowModel
    });
    this.addView(this._infowindowFormView);
    this.$('.js-select').append(this._infowindowFormView.render().el);
  }
});
