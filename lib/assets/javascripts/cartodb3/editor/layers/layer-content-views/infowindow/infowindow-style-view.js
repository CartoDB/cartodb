var cdb = require('cartodb.js');
var CarouselFormView = require('../../../../components/carousel-form-view');
var CarouselCollection = require('../../../../components/custom-carousel/custom-carousel-collection');
// var InfowindowStyleFormView = require('./infowindow-style-form-view');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerInfowindowModel) throw new Error('layerInfowindowModel is required');
    this._layerInfowindowModel = opts.layerInfowindowModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    this._renderCarousel();
    this._renderForm();

    return this;
  },

  _initBinds: function () {
    this.model = new cdb.core.Model({ type: this._layerInfowindowModel.getAlternativeName(this.fieldName) || this.fieldName })
    this.model.on('change:type', this._renderForm, this);

    // if (!this._layerTableModel.get('fetched')) {
    //   this.listenToOnce(this._layerTableModel, 'change:fetched', this.render);
    //   this._layerTableModel.fetch();
    // }
  },

  _renderCarousel: function () {
    var carouselCollection = new CarouselCollection(
      [
        {
          selected: true,
          val: 'none',
          label: _t('editor.layers.infowindow.style.none'),
          template: function () {
            return _t('editor.layers.infowindow.style.none');
          }
        }, {
          selected: false,
          val: 'infowindow_light',
          label: _t('editor.layers.infowindow.style.light'),
          template: function () {
            return _t('editor.layers.infowindow.style.light');
          }
        }, {
          selected: false,
          val: 'infowindow_dark',
          label: _t('editor.layers.infowindow.style.dark'),
          template: function () {
            return _t('editor.layers.infowindow.style.dark');
          }
        }, {
          selected: false,
          val: 'infowindow_light_header_blue',
          label: _t('editor.layers.infowindow.style.color'),
          template: function () {
            return _t('editor.layers.infowindow.style.color');
          }
        }, {
          selected: false,
          val: 'infowindow_header_with_image',
          label: _t('editor.layers.infowindow.style.image'),
          template: function () {
            return _t('editor.layers.infowindow.style.image');
          }
        }
      ]
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

  _renderForm: function () {
    // if (this._formInfowindowStyleView) {
    //   this.removeView(this._formInfowindowStyleView);
    //   this._formInfowindowStyleView.clean();
    // }
    // this._infowindowStyleFormView = new InfowindowStyleFormView({
    //   layerInfowindowModel: this._layerInfowindowModel
    // });
    // this.addView(this._infowindowStyleFormView);
    // this.$el.append(this._infowindowStyleFormView.render().el);
  }

});
