<template>
  <div class="u-flex u-flex__direction--column u-flex__align--center">
    <div v-if="error">
      <div class="text is-small is-semibold is-txtAlert">
        Connection failed: we were unable to connect to Dropbox
      </div>
      <div class="text is-small is-txtMidGrey">
        Be sure you have any pop-up blockers deactivated for this website.
      </div>
    </div>
    <span v-if="requestingPermissions" class="text is-small is-txtMidGrey">Requesting oAuth</span>
    <span v-if="!requestingPermissions && checkingPermissions" class="text is-small is-txtMidGrey">Checking token...</span>
    <div v-if="loading" class="u-mt--32">
      <LoadingState size="40px" primary/>
    </div>
  </div>
</template>

<script>

import LoadingState from 'new-dashboard/components/States/LoadingState';

export default {
  name: 'OAuthConnectionForm',
  components: {
    LoadingState
  },
  props: {
    connector: {
      required: true
    }
  },
  data () {
    return {
      error: false,
      requestingPermissions: true,
      checkingPermissions: false
    };
  },
  computed: {
    loading () {
      return this.requestingPermissions || this.checkingPermissions;
    }
  },
  async mounted () {
    // const existOAuthConnection = false;
    const existOAuthConnection = await this.checkOAuthPermissions();

    if (existOAuthConnection) {
      this.$router.push({ name: 'new-connection-connection-dataset', params: { id: existOAuthConnection.id } });
    } else {
      const oauthUrl = await this.$store.dispatch('connectors/createNewOauthConnection', this.connector.options.service);
      this.openOAuthPopup(oauthUrl);
    }
  },
  methods: {
    async checkOAuthPermissions () {
      let existingConnection = null;
      this.checkingPermissions = true;
      try {
        const data = await this.$store.dispatch('connectors/checkOauthConnection', this.connector.options.service);
        if (data) {
          this.requestingPermissions = false;
          this.checkingPermissions = false;
          existingConnection = data;
        }
      } catch (error) {
        if (!this.requestingPermissions) {
          this.error = true;
          this.checkingPermissions = false;
        }
      }
      return existingConnection;
    },
    openOAuthPopup (url) {
      const oauthPopup = window.open(
        url,
        null,
        'menubar=no,toolbar=no,width=600,height=495'
      );

      const interval = window.setInterval(() => {
        if (oauthPopup && oauthPopup.closed) {
          this.requestingPermissions = false;
          this.checkOAuthPermissions();
          clearInterval(interval);
        } else if (!oauthPopup) {
          this.error = true;
          this.requestingPermissions = false;
          clearInterval(interval);
        }
      }, 1000);
    }
  },
  watch: {
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
</style>
