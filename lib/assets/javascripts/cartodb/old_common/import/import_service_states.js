

  cdb.admin.service_states = {

    // TOKEN!
    token: {
      loader: true,
      list:   false,
      msg:    _t('Checking token...'),
      file:   false,
      info:   'token',
      change:  {
        css: {
          display: 'none'
        }
      },
      service: {
        css: {
          display: 'none'
        }
      }
    },
    
    // OAUTH!
    oauth: {
      loader: true,
      list:   false,
      msg:    _t('Requesting oAuth...'),
      file:   false,
      info:   'oauth',
      change:  {
        css: {
          display: 'none'
        }
      },
      service: {
        css: {
          display: 'none'
        }
      }
    },

    // GETTING FILES
    retrieving: {
      loader: true,
      list:   false,
      msg:    _t('Getting information...'),
      file:   false,
      info:   'list',
      change:  {
        css: {
          display: 'none'
        }
      },
      service: {
        css: {
          display: 'none'
        }
      }
    },
    
    // SHOW LIST!
    retrieved: {
      loader: false,
      list:   true,
      msg:    false,
      file:   false,
      info:   '',
      change:  {
        css: {
          display: 'none'
        }
      },
      service: {
        css: {
          display: 'none'
        }
      }
    },
    
    // ERROR!
    error: {
      loader: false,
      list:   false,
      msg:    false,
      file:   false,
      info:   'error',
      change:  {
        css: {
          display: 'none'
        }
      },
      service: {
        css: {
          display: 'block'
        }
      }
    },
    
    // FILE CHOSEN
    chosen: {
      loader: false,
      list:   false,
      msg:    false,
      file:   true,
      info:   '',
      change:  {
        css: {
          display: 'block'
        }
      },
      service: {
        css: {
          display: 'none'
        }
      }
    }

  };
