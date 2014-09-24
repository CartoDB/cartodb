
  /**
   *  Create dialog layer UI actions
   *  when state or upload changes
   *
   */

  cdb.admin.CreateLayerDialog.states = {

    // IDLE STATE
    idle: {
      title: {
        enabled: {
          default: false,
          twitter: false
        }
      },
      tabs: { enabled: true },
      content: { enabled: true },
      progress: { enabled: false },
      close: { enabled: true },
      upgrade: { enabled: true },
      abort: { enabled: false },
      ok: {
        text: {
          default:  _t('Create table'),
          layer:    _t('Add layer'),
          scratch:  _t('Create empty table')
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
      tabs: { enabled: true },
      content: { enabled: true },
      progress: { enabled: false },
      close: { enabled: true },
      upgrade: { enabled: true },
      abort: { enabled: false },
      ok: {
        text: {
          default:  _t('Create table'),
          layer:    _t('Add layer'),
          scratch:  _t('Create empty table')
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
      tabs: { enabled: true },
      content: { enabled: true },
      progress: { enabled: false },
      close: { enabled: true },
      upgrade: { enabled: true },
      abort: { enabled: false },
      ok: {
        text: {
          default:  _t('Create table'),
          scratch:  _t('Create empty table')
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
      tabs: { enabled: false },
      content: { enabled: false },
      progress: {
        enabled:  true,
        text:     {
          default:  _t('Uploading your data'),
          file:     _t('Uploading your data'),
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

    // GETTING STATE (uploading file to our servers)
    getting: {
      title: {
        enabled: {
          default: false
        }
      },
      tabs: { enabled: false },
      content: { enabled: false },
      progress: {
        enabled: true,
        text:     {
          default:  _t('Downloading your data'),
          file:     _t('Downloading your data'),
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
      abort: { enabled: true },
      ok: {
        text: {
          default:  _t('Hide this window')
        },
        classes: 'ok disabled button grey',
        parent: 'middle'
      }
    },

    // IMPORTING STATE
    importing: {
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
          scratch:  _t('Importing your table'),
          twitter:  _t('Importing. Depending on the amount of tweets, this can take a while'),
          arcgis:   _t('Importing your ArcGIS data')
        }
      }
    },

    // UNPACKING STATE
    unpacking: {
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
      tabs: { enabled: false },
      content: { enabled: false },
      progress: {
        enabled: true,
        text:     {
          default:  _t('Creating your table'),
          file:     _t('Creating your table'),
          gdrive:   _t('Creating your table'),
          dropbox:  _t('Creating your table'),
          layer:    _t('Creating your table'),
          scratch:  _t('Creating your table'),
          twitter:  _t('Creating your table'),
          arcgis:   _t('Creating your table')
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
          twitter:  _t('Add layer')
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
      tabs: { enabled: true },
      content: { enabled: true },
      progress: { enabled: false },
      close: { enabled: true },
      upgrade: { enabled: true },
      abort: { enabled: false },
      ok: {
        text: {
          default:  _t('Create table'),
          layer:    _t('Add layer'),
          scratch:  _t('Create empty table')
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
