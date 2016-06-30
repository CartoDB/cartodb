var _ = require('underscore');
var Backbone = require('backbone');
var template = require('./taglist/taglist.tpl');
var TagView = require('./taglist/taglist-item-view');
var TagCollection = require('./taglist/taglist-collection');

require('jquery');
require('jquery-ui');
require('tagit');

Backbone.Form.editors.Taglist = Backbone.Form.editors.Base.extend({
  className: 'Form-tags CDB-Text',
  events: {
    'mouseover': '_onMouseOver',
    'mouseout': '_onMouseOut',
    'change': function () {
      this.trigger('change', this);
    },
    'focus': function () {
      this.trigger('focus', this);
    },
    'blur': function () {
      this.trigger('blur', this);
    }
  },
  initialize: function (opts) {
    this.options = _.extend(
      {},
      this.options,
      opts.schema.options
    );

    Backbone.Form.editors.Base.prototype.initialize.call(this, opts);
    this._tagCollection = new TagCollection(opts.schema.options.tags);

    this._tagCollection.on('reset', function () {
      console.log('reset');
    }, this);

    this.isEditable = opts.schema.options.isEditable || true;
  },

  render: function () {
    this._initViews();
  },

  _initViews: function () {
    var self = this;
    var tagsPlaceholder = (!this.isEditable && this._tagCollection.length === 0) ? 'No tags' : 'Add tags';

    this.$el.html(template());

    this._tagCollection.each(this._renderTag, this);

    this.$('.js-tagsList').tagit({
      allowSpaces: true,
      placeholderText: tagsPlaceholder,
      readOnly: !this.isEditable,
      onBlur: function () {
        self.isEditable && self.$el.removeClass('is-focus');
      },
      onFocus: function () {
        self.isEditable && self.$el.removeClass('is-hover').addClass('is-focus');
      },
      afterTagAdded: self._onTagAdded.bind(self),
      afterTagRemoved: self._onTagRemoved.bind(self)
    });
  },

  _renderTag: function (model) {
    var view = new TagView({
      label: model.get('label')
    });

    this.$('.js-tagsList').append(view.render().el);
  },

  focus: function () {
    if (this.hasFocus) return;
    this.$el.focus();
  },

  blur: function () {
    if (!this.hasFocus) return;
    this.$el.blur();
  },

  getValue: function () {
    return this._tagCollection.getValue();
  },

  setValue: function (tags) {
    this._tagCollection.reset(this._normalize(tags));
    this._destroyTagit();
    this.render();
  },

  _onMouseOver: function () {
    !this.$el.hasClass('is-focus') && this.$el.addClass('is-hover');
  },

  _onMouseOut: function () {
    !this.$el.hasClass('is-focus') && this.$el.removeClass('is-hover');
  },

  _onTagRemoved: function (e, ui) {
    var tag = ui.tag.find('.tagit-label').text();
    this._tagCollection.removeTag(tag);
  },

  _onTagAdded: function (e, ui) {
    var tag = ui.tag.find('.tagit-label').text();
    this._tagCollection.addTag(tag);
  },

  _normalize: function (tags) {
    return _.map(tags.split(','), function (tag) {
      return {
        label: tag.trim()
      };
    });
  },

  _destroyTagit: function () {
    // cannot call public methods before initilization
    // checking ui-widget class does the trick
    (this.$('.ui-widget').length > 0) && this.$('.js-tagsList').tagit('destroy');
  },

  remove: function () {
    this._destroyTagit();
    Backbone.Form.editors.Base.prototype.remove.apply(this);
  },

  clean: function () {
    this.$el.remove();
  }
});
