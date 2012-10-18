
  /**
   *  Different import status for animations
   *  - Reset upload
   *  - Create a table from scratch
   *  - Upload a file
   *  - Importing a file
   */

  cdb.admin.dashboard.upload_states = {
    // RESETING!
    reset: {
      enable: true,
      option: 0,
      hideUpload: true,
      title: "New table",
      description: "Choose between the following options to create a new table.",
      hideClose: false,
      ok: {
        removeClasses: "grey",
        addClasses: "disabled green",
        text: "Create table"
      },
      list: {
        animate: {
          properties: {
            marginTop: "0px",
            height: "100%",
            opacity: 1
          },
          options: {
            duration: 500  
          }
        }
      },
      loader: {
        animate: {
          properties: {
            top: "<%= top %>",
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
      showLoader: false
    },
    // CREATING!
    creating: {
      enable: false,
      option: 2,
      hideUpload: true,
      title: "Creating your table...",
      description: "Give us some second to create it and then you will be redirected...",
      hideClose: true,
      ok: {
        removeClasses: "",
        addClasses: "disabled",
        text: "Create table"
      },
      list: {
        animate: {
          properties: {
            marginTop: "-30px",
            height: "0",
            opacity: "0"
          },
          options: {
            duration: 800,
            queue: true
          }          
        }
      },
      loader: {
        animate: {
          properties: {
            top: "<%= top %>"
          },
          options: {
            duration: 500,
            queue: false
          }
        },
        removeClasses:"",
        addClasses: "creating",
        text: "Creating your table...",
        progress: 100,
        css: {},
      },
      showLoader: true
    },
    // UPLOADING!
    uploading: {
      enable: false,
      option: 0,
      hideUpload: false,
      title: "Uploading your data",
      description: "It will take us some time...",
      hideClose: true,
      ok: {
        removeClasses: "",
        addClasses: "disabled",
        text: "Create table"
      },
      list: {
        animate: {
          properties: {
            marginTop: "-10px",
            height: "0",
            opacity: "0"
          },
          options: {
            duration: 800,
            queue: true
          }
        }
      },
      loader: {
        animate: {
          properties: {
            top: "<%= top %>",
            opacity: 1
          },
          options: {
            duration: 500,
            queue: false
          }  
        },      
        removeClasses:"",
        addClasses: "creating",
        text: "Uploading your table...",
        progress: 4,
        css: {
          top: "110px",
          opacity: 0
        }
      },
      showLoader: true
    },
    // IMPORTING!
    importing: {
      enable: true,
      option: 3,
      hideUpload: false,
      title: "Creating your table...",
      description: "Now, you can hide this window and your table creation will continue.",
      ok: {
        removeClasses: "green disabled",
        addClasses: "grey",
        text: "Hide this window"
      },
      hideClose: true,
      foot: {
        text: "When hiding this window, follow the progress in the bottom left corner of your screen."
      },      
      list: {
        animate: {
          properties: {
            marginTop: "-10px",
            height: "0",
            opacity: "0"
          },
          options: {
            duration: 800,
            queue: true
          }
        }
      },
      loader: {
        animate: {
          properties: {
            top: "<%= top %>",
            left: "40px",
            opacity: 1
          },
          options: {
            duration: 500,
            queue: false
          }
        },
        removeClasses:"uploading",
        addClasses: "creating",
        text: "Creating your table...",
        progress: 100,
        css: {
          top: "110px",
          opacity: 0
        }
      },
      showLoader: true
    }
  }