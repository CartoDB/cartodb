
  /**
   *  Create dialog UI actions
   *  when state or upload changes
   *
   */

  cdb.common.CreateDialog.states = {

    // IDLE STATE
    idle: {
      title: {
        enabled: {
          default: false,
          twitter: false
        }
      },
      navigation: { enabled: true },
      tabs: { enabled: true },
      content: { enabled: true },
      progress: { enabled: false },
      close: { enabled: true },
      upgrade: { enabled: true },
      abort: { enabled: false },
      ok: {
        text: {
          default:  _t('Create dataset'),
          layer:    _t('Add layer'),
          scratch:  _t('Create empty dataset')
        },
        classes: 'ok button green',
        parent: 'to_right'
      }
    },

    // RESET STATE
    reset: {
      title: {
        enabled: {
          default: true,
          twitter: false
        }
      },
      navigation: { enabled: true },
      tabs: { enabled: true },
      content: { enabled: true },
      progress: { enabled: false },
      close: { enabled: true },
      upgrade: { enabled: true },
      abort: { enabled: false },
      ok: {
        text: {
          default:  _t('Create dataset'),
          layer:    _t('Add layer'),
          scratch:  _t('Create empty dataset')
        },
        classes: 'ok button green',
        parent: 'to_right '
      }
    },

    // ADDED STATE
    added: {
      title: {
        enabled: {
          default: false
        }
      },
      navigation: { enabled: true },
      tabs: { enabled: true },
      content: { enabled: true },
      progress: { enabled: false },
      close: { enabled: true },
      upgrade: { enabled: true },
      abort: { enabled: false },
      ok: {
        text: {
          default:  _t('Create dataset'),
          scratch:  _t('Create empty dataset')
        },
        classes: 'ok button green',
        parent: 'to_right'
      }
    },

    // SELECTED STATE
    selected: {
      title: {
        enabled: {
          default: false
        }
      },
      navigation: { enabled: false },
      tabs: { enabled: false },
      content: { enabled: false },
      progress: {
        enabled:  true,
        text:     {
          default:  _t('Uploading your data'),
          file:     {
            file:   _t('Uploading your data'),
            url:    _t('Downloading file')
          },
          gdrive:   _t('Uploading your data'),
          dropbox:  _t('Uploading your data'),
          layer:    _t(''),
          scratch:  _t('Uploading your data'),
          twitter:  _t('Importing. Depending on the amount of tweets, this can take a while'),
          arcgis:  _t('Importing your ArcGIS data')
        }
      },
      close: { enabled: false },
      upgrade: { enabled: false },
      abort: { enabled: true },
      ok: {
        text: {
          default:  _t('Hide this window')
        },
        classes: 'ok disabled button grey',
        parent: 'middle'
      }
    },

    // PENDING STATE (waiting for the import queue)
    pending: {},

    // GETTING STATE (uploading file to our servers)
    getting: {
      title: {
        enabled: {
          default: false
        }
      },
      navigation: { enabled: false },
      tabs: { enabled: false },
      content: { enabled: false },
      progress: {
        enabled: true,
        text:     {
          default:  _t('Downloading your data'),
          file:     {
            file:   _t('Uploading your data'),
            url:    _t('Downloading file')
          },
          gdrive:   _t('Downloading your Google Drive file'),
          dropbox:  _t('Downloading your Dropbox file'),
          layer:    _t(''),
          scratch:  _t(''),
          twitter:  _t(''),
          arcgis:   _t('')
        }
      },
      close: { enabled: false },
      upgrade: { enabled: false },
      abort: { enabled: true },
      ok: {
        text: {
          default:  _t('Hide this window')
        },
        classes: 'ok disabled button grey',
        parent: 'middle'
      }
    },

    // UPLOADING STATE
    uploading: {
      title: {
        enabled: {
          default: false
        }
      },
      navigation: { enabled: false },
      tabs: { enabled: false },
      content: { enabled: false },
      progress: {
        enabled: true,
        text:     {
          default:  _t('Uploading your data'),
          file:     {
            file:   _t('Uploading your data'),
            url:    _t('Downloading file')
          },
          gdrive:   _t('Uploading your Google Drive file'),
          dropbox:  _t('Uploading your Dropbox file'),
          layer:    _t(''),
          scratch:  _t('Uploading your data'),
          twitter:  _t('Importing. Depending on the amount of tweets, this can take a while'),
          arcgis:   _t('Importing your ArcGIS data')
        }
      },
      close: { enabled: false },
      upgrade: { enabled: false },
      abort: { enabled: false },
      ok: {
        text: {
          default:  _t('Hide this window')
        },
        classes: 'ok button grey',
        parent: 'middle'
      }
    },

    // IMPORTING STATE
    importing: {
      navigation: { enabled: false },
      tabs: { enabled: false },
      content: { enabled: false },
      progress: {
        enabled: true,
        text:     {
          default:  _t('Importing your file'),
          file:     _t('Importing your file'),
          gdrive:   _t('Importing your Google Drive file'),
          dropbox:  _t('Importing your Dropbox file'),
          layer:    _t(''),
          scratch:  _t('Importing your dataset'),
          twitter:  _t('Importing. Depending on the amount of tweets, this can take a while'),
          arcgis:  _t('Importing your ArcGIS data')
        }
      }
    },

    // GUESSING STATE
    guessing: {
      navigation: { enabled: false },
      tabs: { enabled: false },
      content: { enabled: false },
      progress: {
        enabled: true,
        text:     {
          default:  _t('Guessing geocodable content on your file'),
          file:     _t('Guessing geocodable content on your file'),
          gdrive:   _t('Guessing geocodable content on your Google Drive file'),
          dropbox:  _t('Guessing geocodable content on your Dropbox file'),
          layer:    _t(''),
          scratch:  _t('Guessing geocodable content on your dataset'),
          twitter:  _t('Guessing content. Depending on the amount of tweets, this can take a while'),
          arcgis:  _t('Guessing geocodable content of your ArcGIS data')
        }
      }
    },

    // GEOCODING STATE
    geocoding: {
      navigation: { enabled: false },
      tabs: { enabled: false },
      content: { enabled: false },
      progress: {
        enabled: true,
        text:     {
          default:  _t('Geocoding your data'),
          file:     _t('Geocoding your file'),
          gdrive:   _t('Geocoding your Google Drive file'),
          dropbox:  _t('Geocoding your Dropbox file'),
          layer:    _t(''),
          scratch:  _t('Geocoding your dataset'),
          twitter:  _t('Geocoding. Depending on the amount of tweets, this can take a while'),
          arcgis:  _t('Geocoding your ArcGIS data')
        }
      }
    },

    // UNPACKING STATE
    unpacking: {
      navigation: { enabled: false },
      tabs: { enabled: false },
      content: { enabled: false },
      progress: {
        enabled: true,
        text:     {
          default:  _t('Unpacking your data'),
          file:     _t('Unpacking your data'),
          gdrive:   _t('Unpacking your Google Drive file'),
          dropbox:  _t('Unpacking your Dropbox file'),
          layer:    _t(''),
          scratch:  _t(''),
          twitter:  _t('Unpacking your Twitter data'),
          arcgis:   _t('Unpacking your ArcGIS data')
        }
      }
    },

    // CREATING STATE
    creating: {
      navigation: { enabled: false },
      tabs: { enabled: false },
      content: { enabled: false },
      progress: {
        enabled: true,
        text:     {
          default:  _t('Creating your dataset'),
          file:     _t('Creating your dataset'),
          gdrive:   _t('Creating your dataset'),
          dropbox:  _t('Creating your dataset'),
          layer:    _t('Creating your dataset'),
          scratch:  _t('Creating your dataset'),
          twitter:  _t('Creating your dataset'),
          arcgis:   _t('Creating your dataset')
        }
      },
      close: { enabled: false },
      upgrade: { enabled: false },
      abort: { enabled: false },
      ok: {
        text: {
          default:  _t('Hide this window')
        },
        classes: 'ok disabled button grey',
        parent: 'middle'
      }
    },

    // ALL DONE!
    complete: {
      navigation: { enabled: false },
      tabs: { enabled: false },
      content: { enabled: true },
      progress: { enabled: false },
      close: { enabled: true },
      upgrade: { enabled: false },
      abort: { enabled: false },
      success: {
        enabled: {
          default: false,
          twitter: true
        }
      },
      ok: {
        text: {
          default:  _t(''),
          twitter:  _t('Go to dataset')
        },
        classes: 'ok button grey',
        parent: 'middle'
      }
    },

    // ABORT STATE
    abort: {
      title: {
        enabled: {
          default: true,
          twitter: false
        }
      },
      navigation: { enabled: true },
      tabs: { enabled: true },
      content: { enabled: true },
      progress: { enabled: false },
      close: { enabled: true },
      upgrade: { enabled: true },
      abort: { enabled: false },
      ok: {
        text: {
          default:  _t('Create dataset'),
          layer:    _t('Add layer'),
          scratch:  _t('Create empty dataset')
        },
        classes: 'ok button green',
        parent: 'to_right'
      }
    },

    // OOUCH STATE
    error: {
      title: {
        enabled: {
          default: false
        }
      },
      navigation: { enabled: false },
      tabs: { enabled: true },
      content: { enabled: true },
      progress: { enabled: false },
      close: { enabled: true },
      upgrade: { enabled: false },
      abort: { enabled: false },
      ok: {
        text: {
          default:  _t('Close')
        },
        classes: 'ok button grey',
        parent: 'to_right'
      }
    }
  }
