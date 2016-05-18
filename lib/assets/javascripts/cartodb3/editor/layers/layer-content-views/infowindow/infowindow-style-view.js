var cdb = require('cartodb.js');
var CarouselFormView = require('../../../../components/carousel-form-view');
var CarouselCollection = require('../../../../components/custom-carousel/custom-carousel-collection');
// var InfowindowStyleFormView = require('./infowindow-style-form-view');
var _ = require('underscore');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    if (!opts.templateStyles) throw new Error('templateStyles is required');
    if (!opts.infowindowTemplate) throw new Error('infowindowTemplate is required');
    this._layerInfowindowModel = opts.layerInfowindowModel;
    this._infowindowTemplate = opts.infowindowTemplate;
    this._templateStyles = opts.templateStyles;
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._renderCarousel();
    // this._renderForm();

    return this;
  },

  _renderCarousel: function () {
    var template_label = this._infowindowTemplate ? this._infowindowTemplate.label : 'None';

    var carouselCollection = new CarouselCollection(
      _.map(this._templateStyles, function (style) {
        return {
          selected: template_label === style.label,
          val: style.value,
          label: style.label,
          template: function () {
            return style.label;
          }
        };
      }, this)
    );

    carouselCollection.bind('change:selected', function (mdl) {
      if (mdl.get('selected')) {
        this._layerInfowindowModel.setTemplate(mdl.getValue());
      }
    }, this);

    var view = new CarouselFormView({
      collection: carouselCollection,
      template: require('./infowindow-style.tpl')
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  // _renderForm: function () {
  //   if (this._formInfowindowStyleView) {
  //     this.removeView(this._formInfowindowStyleView);
  //     this._formInfowindowStyleView.clean();
  //   }
  //   this._infowindowStyleFormView = new InfowindowStyleFormView({
  //     layerInfowindowModel: this._layerInfowindowModel
  //   });
  //   this.addView(this._infowindowStyleFormView);
  //   this.$el.append(this._infowindowStyleFormView.render().el);
  // }

  _unselectAll: function () {
    this._layerInfowindowModel.clearFields();
  }

});
