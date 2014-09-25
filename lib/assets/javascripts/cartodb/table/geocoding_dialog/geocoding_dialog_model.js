
  /**
   *  Geocoding dialog model needed to track which geocoding
   *  will be performed
   *
   *
   *  POSSIBLE MODEL STATES
   *
   *  - Idle (normal state)
   *  - Selected (selected and ready to choose that option)
   *
   *  GEOCODING (hash)
   *
   *  - Hash with all geocoding content. It will be valid if that attribute is true.
   *
   *  ERROR (hash)
   *
   *  - If something went wrong, necessary error data will be here.
   *
   */

  cdb.admin.GeocodingDialog.Model = cdb.core.Model.extend({

    defaults: {
      state: 'idle',
      option: 'lonlat', // tab selected basically
      // upload status
      geocoding: {
        type:   '',
        valid:  false
      }
    }

  })
  