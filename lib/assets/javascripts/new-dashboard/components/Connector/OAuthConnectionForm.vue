<template>
  <div class="u-flex u-flex__direction--column u-flex__align--center">
    <div class="u-flex u-flex__direction--column u-flex__align--center" v-if="error">
      <div class="text is-small is-semibold is-txtAlert">
        {{ $t('ConnectorsPage.oauthErrorTitle', {connector: connector.title}) }}
      </div>
      <div class="text is-small is-txtMidGrey u-mt--8">
        {{ $t('ConnectorsPage.oauthErrorSubtitle') }}
      </div>
      <div class="u-mt--32 u-flex u-flex__align--center">
          <button @click="startingConnection" class="button is-primary">{{ $t('ConnectorsPage.tryAgainButton') }}</button>
      </div>
    </div>
    <span v-if="requestingPermissions" class="text is-small is-txtMidGrey">{{ $t('ConnectorsPage.oauthRequesting') }}</span>
    <span v-if="!requestingPermissions && checkingPermissions" class="text is-small is-txtMidGrey">{{ $t('ConnectorsPage.oauthCheckingToken') }}</span>
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
      interval: null,
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
    const existOAuthConnection = await this.checkOAuthPermissions();

    if (existOAuthConnection) {
      this.connectionSuccess(existOAuthConnection);
    } else {
      this.startingConnection();
    }
  },
  beforeDestroy () {
    if (this.interval) {
      clearInterval(this.interval);
    }
  },
  methods: {
    async startingConnection () {
      this.error = false;
      this.requestingPermissions = true;
      this.checkingPermissions = false;
      const oauthUrl = await this.$store.dispatch('connectors/createNewOauthConnection', this.connector.options.service);

      this.openOAuthPopup(oauthUrl);
    },
    connectionSuccess (conn) {
      this.$emit('connectionSuccess', conn.id);
    },
    async checkOAuthPermissions () {
      let existingConnection = null;
      this.checkingPermissions = true;
      try {
        const data = await this.$store.dispatch('connectors/checkOauthConnection', this.connector.options.service);
        if (data) {
          this.requestingPermissions = false;
          this.checkingPermissions = false;
          existingConnection = data;
          this.connectionSuccess(existingConnection);
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

      this.interval = window.setInterval(() => {
        if (oauthPopup && oauthPopup.closed) {
          this.requestingPermissions = false;
          this.checkOAuthPermissions();
          clearInterval(this.interval);
        } else if (!oauthPopup) {
          this.error = true;
          this.requestingPermissions = false;
          clearInterval(this.interval);
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
