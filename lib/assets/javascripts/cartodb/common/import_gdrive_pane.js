
  /**
   *  GDrive pane for upload files
   *  
   *  - Needs to load picker in the html view.
   *    
   *    <script src="https://www.google.com/jsapi?key=AIzaSyDzeK_h4JhsU9-wtNaR3j0ZeeYBLtaPcEA"></script>
   *    google.load('picker', '1');
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

    render: function() {
      this.$el.append(this.template());
      return this;
    },

    _onClickGDButton: function(e) {
      var self = this;

      e.preventDefault();
      e.stopPropagation();

      // console.log(google);
      var view = new google.picker.View(google.picker.ViewId.DOCS);
      // var token = gapi.auth.getToken().access_token;

      var picker = new google.picker.PickerBuilder()
          .enableFeature(google.picker.Feature.NAV_HIDDEN)
          .setAppId("1068986758311.apps.googleusercontent.com")
          // .setOAuthToken(token)
          .addView(view)
          .addView(new google.picker.DocsUploadView())
          .setCallback(self._pickerCallback)
          .build();
       picker.setVisible(true);
    },

    _pickerCallback: function(data) {
      console.log(google.picker.Action.PICKED);
      if (data.action == google.picker.Action.PICKED) {
        var doc = data.docs[0];
        var fileId = doc.id;

        this._printFile(fileId);
      }
    },

    _printFile: function(fileId) {
      $.ajax({
        crossOrigin: true,
        url: 'https://www.googleapis.com/drive/v2/files/' + fileId,
        success: function(r) {
          console.log(r);
        }
      })
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
    }
  });
