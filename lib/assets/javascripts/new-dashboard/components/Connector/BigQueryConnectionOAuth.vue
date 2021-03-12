<template>
  <div class="u-flex u-flex__justify--center">
    <div class="main u-flex u-flex__align--center u-flex__direction--column">
      <!-- DISCLAIMER -->
      <div v-if="!connectionModel" class="disclaimer">
        <h4 class="is-small is-semibold u-mt--16">{{$t('ConnectorsPage.BigQuery.title')}}</h4>
        <ul class="u-mt--8">
          <li class="u-mb--16">
            <span class="text is-small" v-html="$t('ConnectorsPage.BigQuery.disclaimer1')"></span>
          </li>
          <li class="u-mb--16">
            <span class="text is-small" v-html="$t('ConnectorsPage.BigQuery.disclaimer2')"></span>
          </li>
          <li class="u-mb--16">
            <span class="text is-small" v-html="$t('ConnectorsPage.BigQuery.disclaimer3Oauth')"></span>
          </li>
          <li class="u-mb--16">
            <span class="text is-small" v-html="$t('ConnectorsPage.BigQuery.disclaimer4Oauth')"></span>
          </li>
          <li class="u-mb--16">
            <span class="text is-small" v-html="$t('ConnectorsPage.BigQuery.disclaimer4')"></span>
          </li>
        </ul>
        <ErrorMessage v-if="error" :message="error"></ErrorMessage>
        <div class="u-mt--48 u-flex u-flex__justify--end u-flex__align--center">
          <button @click="cancel" class="is-small is-semibold is-txtPrimary">{{$t('ConnectorsPage.BigQuery.conditions.cancel')}}</button>
          <button v-if="!loading" @click="accept" class="button is-primary u-ml--36">{{error ? 'Try again': $t('DataPage.continue')}}</button>
          <LoadingState size="36px" primary v-else></LoadingState>
        </div>
      </div>
      <!-- UPLOAD FILE -->
      <div v-else class="u-flex u-flex__direction--column">
        <div class="section-header is-semibold is-small u-mb--4">
          {{$t('ConnectorsPage.BigQuery.billingProject')}}
        </div>
        <div class="text is-small is-txtMidGrey u-mb--24" v-html="$t('ConnectorsPage.BigQuery.billingHelper')"></div>
        <SelectComponent v-model="connectionModel.billing_project" :elements="projects" :disabled="!(projects && projects.length)"></SelectComponent>
        <ErrorMessage v-if="error" :message="error"></ErrorMessage>

        <div class="u-flex u-flex__justify--end u-mt--32">
          <button @click="cancel" class="u-mr--28 is-small is-semibold is-txtPrimary">{{$t('ConnectorsPage.cancel')}}</button>
          <button @click="connect" class="CDB-Button CDB-Button--primary CDB-Button--big" :class="{'is-disabled': (!connectionModelIsValid || !projects || !projects.length || submited)}">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium">
              {{ $t('DataPage.connect') }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import ErrorMessage from 'new-dashboard/components/ErrorMessage/ErrorMessage';
import SelectComponent from 'new-dashboard/components/forms/SelectComponent';
import LoadingState from 'new-dashboard/components/States/LoadingState';
import uploadData from '../../mixins/connector/uploadData';
import { mapState } from 'vuex';

export default {
  name: 'BigQueryConnectionOAuth',
  components: {
    SelectComponent,
    ErrorMessage,
    LoadingState
  },
  mixins: [uploadData],
  props: {
    connection: null
  },
  data () {
    return {
      loading: false,
      error: '',
      submited: false,
      projects: null,
      connectionModel: null
    };
  },
  computed: {
    ...mapState({
      email: state => state.user.email
    }),
    connectionModelIsValid () {
      return this.connectionModel.billing_project;
    }
  },
  async mounted () {
    if (this.connection) {
      this.connectionModel = { id: this.connection.id, billing_project: this.connection.parameters.billing_project };
      await this.getProjects(this.connection.id);
    }
  },
  methods: {
    cancel () {
      this.$emit('cancel');
    },
    async connect () {
      this.submited = true;
      try {
        await this.$store.dispatch('connectors/updateBQConnectionBillingProject', this.connectionModel);
        this.connectionSuccess(this.connectionModel);
      } catch (e) {
        this.submited = false;
        this.error = this.$t('ConnectorsPage.BigQuery.connection-error_internal');
      }
    },
    async accept () {
      await this.startingConnection();
    },
    async startingConnection () {
      this.error = '';
      this.loading = true;
      const { auth_url: oauthUrl } = await this.$store.dispatch('connectors/createNewBQConnectionThroughOAuth');
      this.openOAuthPopup(oauthUrl);
    },
    connectionSuccess (conn) {
      this.$emit('connectionSuccess', conn.id);
    },
    async checkOAuthPermissions () {
      try {
        const data = await this.$store.dispatch('connectors/checkBQConnectionThroughOAuth');
        if (data) {
          await this.getProjects(data.id);
          this.loading = false;
          this.connectionModel = data;
          this.connectionModel.billing_project = this.projects[0].id;
        }
      } catch (error) {
        this.error = this.$t('ConnectorsPage.BigQuery.connection_oauth_error');
        this.loading = false;
      }
    },
    async getProjects (connId) {
      const projects = await this.$store.dispatch('connectors/fetchBQProjectsList', connId);
      if (projects) {
        this.projects = projects.map(p => ({ id: p.id, label: p.friendly_name }));
      }
    },
    openOAuthPopup (url) {
      const oauthPopup = window.open(
        url,
        null,
        'menubar=no,toolbar=no,width=600,height=495'
      );

      this.interval = window.setInterval(() => {
        if (oauthPopup && oauthPopup.closed) {
          this.checkOAuthPermissions();
          clearInterval(this.interval);
        } else if (!oauthPopup) {
          this.error = this.$t('ConnectorsPage.BigQuery.connection_oauth_error');
          this.loading = false;
          clearInterval(this.interval);
        }
      }, 1000);
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.helper {
  max-width: 512px;
}

.main {
  max-width: 460px;
}
.disclaimer {
  width: 460px;

  .loading-state {
    padding: 0 16px;
    height: 36px;
  }
}

.section-header {
  position: relative;
  line-height: 24px;

  .number {
    position: absolute;
    height: 24px;
    width: 24px;
    left: -36px;
    border-radius: 4px;
    border: 1px solid $neutral--800;
  }
}

.select-wrapper {
  &::v-deep {
    select {
      width: 460px;
    }
  }
}

input {
  width: 512px;
  border: solid 1px #dddddd;
  border-radius: 4px;
  background-color: $white;
  font-size: 12px;
  color: $neutral--800;
  padding: 12px;
  height: 40px;

  &#email {
    cursor: text;
    width: 100%;
  }

  &::placeholder {
    color: rgba(46, 60, 67, 0.48);
  }

  &:-ms-input-placeholder {
    color: rgba(46, 60, 67, 0.48);
  }

  &::-ms-input-placeholder {
    color: rgba(46, 60, 67, 0.48);
  }
}
</style>
