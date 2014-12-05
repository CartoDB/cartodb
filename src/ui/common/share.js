
cdb.ui.common.ShareDialog = cdb.ui.common.Dialog.extend({

  tagName: 'div',
  className: 'cartodb-share-dialog',

  events: {
    'click .ok':       '_ok',
    'click .cancel':   '_cancel',
    'click .close':    '_cancel',
    "click":           '_stopPropagation',
    "dblclick":        '_stopPropagation',
    "mousedown":       '_stopPropagation'
  },

  default_options: {
    title: '',
    description: '',
    ok_title: 'Ok',
    cancel_title: 'Cancel',
    width: 300,
    height: 200,
    clean_on_hide: false,
    enter_to_confirm: false,
    template_name: 'common/views/dialog_base',
    ok_button_classes: 'button green',
    cancel_button_classes: '',
    modal_type: '',
    modal_class: '',
    include_footer: true,
    additionalButtons: []
  },

  initialize: function() {

    _.defaults(this.options, this.default_options);

    _.bindAll(this, 'render', '_keydown');

    this.isOpen = false;

    var self = this;

    if (this.options.target) {
      this.options.target.on("click", function(e) {
        e.preventDefault();
        e.stopPropagation();

        self.open();

      })
    }

    // Keydown bindings for the dialog
    $(document).bind('keydown', this._keydown);

    // After removing the dialog, cleaning other bindings
    this.bind("clean", this._reClean);

  },

  _stopPropagation: function(ev) {

    ev.stopPropagation();

  },

  _stripHTML: function(input, allowed) {

    allowed = (((allowed || "") + "").toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');

    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;

    if (!input || (typeof input != "string")) return '';

    return input.replace(tags, function ($0, $1) {
      return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
    });

  },

  open: function() {

    var self = this;

    this.$el.show(0, function(){
      self.isOpen = true;
    });

  },

  hide: function() {

    var self = this;

    this.$el.hide(0, function(){
      self.isOpen = false;
    });

    if (this.options.clean_on_hide) {
      this.clean();
    }

  },

  toggle: function() {

    if (this.isOpen) {
      this.hide();
    } else {
      this.open();
    }

  },

  _truncateTitle: function(s, length) {

    return s.substr(0, length-1) + (s.length > length ? '…' : '');

  },

  render: function() {

    var $el = this.$el;

    var title             = this.options.title;
    var description       = this.options.description;
    var clean_description = this._stripHTML(this.options.description);
    var share_url         = this.options.share_url;

    var facebook_url, twitter_url;

    this.$el.addClass(this.options.size);

    var full_title    = title + ": " + clean_description;
    var twitter_title;

    if (title && clean_description) {
      twitter_title = this._truncateTitle(title + ": " + clean_description, 112) + " %23map "
    } else if (title) {
      twitter_title = this._truncateTitle(title, 112) + " %23map"
    } else if (clean_description){
      twitter_title = this._truncateTitle(clean_description, 112) + " %23map"
    } else {
      twitter_title = "%23map"
    }

    if (this.options.facebook_url) {
      facebook_url = this.options.facebook_url;
    } else {
      facebook_url = "http://www.facebook.com/sharer.php?u=" + share_url + "&text=" + full_title;
    }

    if (this.options.twitter_url) {
      twitter_url = this.options.twitter_url;
    } else {
      twitter_url = "https://twitter.com/share?url=" + share_url + "&text=" + twitter_title;
    }

    var options = _.extend(this.options, { facebook_url: facebook_url, twitter_url: twitter_url });

    $el.html(this.options.template(options));

    $el.find(".modal").css({
      width: this.options.width
    });

    if (this.render_content) {
      this.$('.content').append(this.render_content());
    }

    if(this.options.modal_class) {
      this.$el.addClass(this.options.modal_class);
    }

    if (this.options.disableLinks) {
      this.$el.find("a").attr("target", "");
    }

    return this;
  }

});
