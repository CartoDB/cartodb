
  /**
   *  Different import status for animations
   *  - Reset upload
   *  - Create a table from scratch
   *  - Upload a file
   *  - Importing a file
   */

  cdb.admin.upload_asset_states = {
    // RESETING!
    reset: {
      enable: true,
      hideClose: false,
      list: {
        animate: {
          properties: {
            marginTop: "0px",
            height: "100%",
            opacity: 1
          },
          options: {
            duration: 500,
            queue: false,
            complete: function() {
              $(this).css('overflow', 'hidden');
            }
          }
        }
      },
      loader: {
        animate: {
          properties: {
            top: "<%- top %>",
            opacity: 0
          },
          options: {
            duration: 500,
            queue: false
          }
        },
        removeClasses:"creating uploading",
        addClasses: "",
        css: {}
      },
      stop: false,
      showLoader: false
    },
    // uploading!
    uploading: {
      enable: false,
      list: {
        animate: {
          properties: {
            marginTop: "-30px",
            height: "0",
            opacity: "0"
          },
          options: {
            duration: 1200,
            queue: true,
            complete: function() {
              $(this).css('overflow', 'hidden');
            }
          }
        }
      },
      loader: {
        animate: {
          properties: {
            top: "<%- top %>",
            opacity: 1
          },
          options: {
            duration: 800,
            queue: false
          }
        },
        removeClasses:"",
        addClasses: "creating",
        text: "Uploading your image...",
        progress: 100,
        css: {},
      },
      stop: false,
      showLoader: true
    }
  }
