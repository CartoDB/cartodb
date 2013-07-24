
  /**
   *  GDrive pane for upload files
   */

  cdb.admin.ImportGdrivePane = cdb.admin.ImportPane.extend({
    className: "import-pane import-pane-gdrive",

    events: {
      'click .gdrive-chooser' : '_onClickGDButton'
    },

    initialize: function() {
      _.bindAll(this, "_pickerCallback");

      this.template = this.options.template || cdb.templates.getTemplate('common/views/import_gdrive');
      this.render();
    },

    _onClickGDButton: function(e) {
      var self = this;

      e.preventDefault();
      e.stopPropagation();

      var view = new google.picker.View(google.picker.ViewId.DOCS);

      var picker = new google.picker.PickerBuilder()
          .enableFeature(google.picker.Feature.NAV_HIDDEN)
          .setAppId("931775862476.apps.googleusercontent.com")
          // .setOAuthToken(AUTH_TOKEN) //Optional: The auth token used in the current Drive API session.
          .addView(view)
          .addView(new google.picker.DocsUploadView())
          .setCallback(self._pickerCallback)
          .build();
       picker.setVisible(true);
    },

    _pickerCallback: function(data) {
      if (data.action == google.picker.Action.PICKED) {
        var doc = data.docs[0];
        var fileId = doc[google.picker.Document.id];

        this._printFile(fileId);
      }
    },

    _printFile: function(fileId) {
      var request = gapi.client.request({
        'path': '/drive/v2/files/'+fileId,
        'method': 'GET',
      });

    request.execute(function(resp) {
      console.log(resp);
      console.log('Title: ' + resp.title);
      console.log('Description: ' + resp.description);
      console.log('MIME type: ' + resp.mimeType);
      console.log('WebContent: ' + resp.webContentLink);
    });
  },

  _downloadFile: function(file, callback) {
    if (file.downloadUrl) {
      var accessToken = gapi.auth.getToken().access_token;
      var xhr = new XMLHttpRequest();
      xhr.open('GET', file.downloadUrl);
      xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
      xhr.onload = function() {
        callback(xhr.responseText);
      };
      xhr.onerror = function() {
        callback(null);
      };
      xhr.send();
    } else {
      callback(null);
    }
  },

  render: function() {
    this.$el.append(this.template());
    return this;
  }
});
