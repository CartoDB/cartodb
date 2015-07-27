
  /**
   *  Create dialog layer UI actions
   *  when state or upload changes
   *
   */

  cdb.admin.CreateLayerDialog.states = _.extend(
    
    cdb.common.CreateDialog.states,
    
    {
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
            arcgis:   _t('Importing your ArcGIS<sup>TM</sup> data')
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
            twitter:  _t('Add layer')
          },
          classes: 'ok button grey',
          parent: 'middle'
        }
      }
      
    }
  );
