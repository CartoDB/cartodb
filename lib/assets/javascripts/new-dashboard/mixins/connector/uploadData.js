import UploadConfig from 'dashboard/common/upload-config';
import * as accounts from 'new-dashboard/core/constants/accounts';

export default {
  computed: {
    getHeaderTitleFromMode (mode) {
      if (this.mode === 'dataset') {
        return this.$t('DataPage.addDataset');
      } else if (this.mode === 'map') {
        return this.$t('MapsPage.createMap');
      } else if (this.mode === 'layer') {
        return this.$t('DataPage.addLayer');
      }
      return '';
    }
  },
  methods: {
    getDefaultPrivacy (accountType) {
      return accounts.accountsWithDefaultPublic.includes(accountType) ? 'PUBLIC' : 'PRIVATE';
    },
    getUploadObject (accountType) {
      return {
        type: '',
        value: '',
        interval: 0,
        privacy: accountType ? this.getDefaultPrivacy(accountType) : '',
        progress: 0,
        // state: 'idle',
        service_item_id: '',
        service_name: '',
        option: '',
        content_guessing: true,
        type_guessing: true,
        create_vis: this.mode === 'map'
      };
    },
    validateUrl (url) {
      const urlregex = /^((http|https|ftp)\:\/\/)/g;

      if (url && urlregex.test(url)) {
        return {
          valid: true,
          msg: ''
        };
      } else {
        return {
          valid: false,
          msg: _t('data.upload-model.url-invalid')
        };
      }
    },
    validateFile (files, remainingByteQuota) {
      // Number of files
      if (files && files.length > 1) {
        return {
          valid: false,
          msg: _t('data.upload-model.one-file')
        };
      }

      // File name
      var name = files[0].name;
      if (!name) {
        return {
          valid: false,
          msg: _t('data.upload-model.file-defined')
        };
      }

      // File size
      if ((remainingByteQuota * UploadConfig.fileTimesBigger) < files[0].size) {
        return {
          valid: false,
          msg: _t('data.upload-model.file-size')
        };
      }
      return {
        valid: true,
        msg: ''
      };
    }
  }
};
