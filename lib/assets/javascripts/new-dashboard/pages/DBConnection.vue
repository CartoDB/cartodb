<template>
  <Page>
    <InputList
      :values="ipList"
      :fieldValidator="checkIfIPIsValid"
      @addElement="onIPsChanged"
      @removeElement="onIPsChanged"></InputList>
  </Page>
</template>

<script>
import { mapState } from 'vuex';
import isIP from 'is-ip';
import Page from 'new-dashboard/components/Page';
import InputList from 'new-dashboard/components/forms/InputList';

export default {
  name: 'DBConnectionPage',
  components: {
    Page,
    InputList
  },

  data () {
    return {
      ipList: []
    };
  },

  computed: mapState({
    client: state => state.client
  }),

  beforeMount () {
    this.getCurrentIPs();
  },

  methods: {
    getCurrentIPs () {
      this.client
        .directDBConnection()
        .getIPs((_, _1, ipList) => {
          this.ipList = ipList.ips.split(',');
        });
    },

    checkIfIPIsValid (value) {
      const isValid = isIP(value);
      let errorText = '';

      if (!isValid) {
        errorText = this.$t('DBConnectionPage.errors.ipNotValid');
      }

      return { isValid, errorText };
    },

    onIPsChanged (IPs) {
      this.client
        .directDBConnection()
        .setIPs(
          IPs.join(','),
          () => { console.log('Successful!'); }
        );
    }
  }
};
</script>
