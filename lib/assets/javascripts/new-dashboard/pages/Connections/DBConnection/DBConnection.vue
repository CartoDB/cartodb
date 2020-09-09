<template>
  <section class="dbconnection">
    <section class="dbconnection-list" v-if="firstStepEnabled">
      <p class="dbconnection__description">
        {{ $t('DBConnection.description_fl') }}
      </p>

      <ul class="dbconnection__tools">
        <li class="dbconnection__tool is-small is-bold">
          <img class="dbconnection__toolimage" src="../../../assets/images/tools/qgis.png" />
          QGIS
        </li>
        <li class="dbconnection__tool is-small is-bold">
          <img class="dbconnection__toolimage" src="../../../assets/images/tools/tableau.png" />
          Tableau
        </li>
        <li class="dbconnection__tool is-small is-bold">
          <img class="dbconnection__toolimage" src="../../../assets/images/tools/qlik.png" />
          Qlik
        </li>
        <li class="dbconnection__tool is-small is-bold">
          <img class="dbconnection__toolimage" src="../../../assets/images/tools/powerBI.png" />
          Power BI
        </li>
        <li class="dbconnection__tool is-small is-bold">
          <img class="dbconnection__toolimage" src="../../../assets/images/tools/databricks.png" />
          Databricks
        </li>
      </ul>

      <p class="dbconnection__description" v-html="$t('DBConnection.description_sl')"></p>

      <section class="dbconnection__ips">
        <SettingsTitle :title="$t('DBConnection.ipsSection.title')"></SettingsTitle>

        <InputList
          ref="ipInputList"
          class="dbconnection__formsection"
          :title="$t('DBConnection.ipsSection.ipList.title')"
          :placeholder="$t('DBConnection.ipsSection.ipList.placeholder')"
          :values="ipList"
          :fieldValidator="checkIfIPIsValid"
          :addElementToState="false"
          @removeElement="onIPRemoved">
          {{ $t('DBConnection.ipsSection.ipList.description') }}
          <a href="javascript:void(0)" @click="fillDeviceIPAddress">{{ $t('DBConnection.ipsSection.ipList.getCurrentIP') }}</a>.
        </InputList>
        <p class="dbconnection__formsection_allowall" v-html="$t('DBConnection.ipsSection.ipList.allowAll')"></p>
      </section>

      <SettingsTitle :title="$t('DBConnection.certificatesSection.title', {certificatesLength, certificateLimit})">
        <div slot="actions">
          <button
            class="button button--small"
            :disabled="!canCreateCertificates"
            @click="goToCertificateCreation">
            {{ $t('DBConnection.certificatesSection.createNewCertificate') }}
          </button>
        </div>
      </SettingsTitle>

      <section class="dbconnection__certificates">
        <template v-if="certificatesLength">
          <CertificateCard
            v-for="certificate in certificates"
            :key="certificate.id"
            :certificate="certificate"
            @revoke="onCertificateRevoked"></CertificateCard>
        </template>

        <p class="dbconnection__empty" v-else>
          {{ $t('DBConnection.certificatesSection.noCertificates') }}
        </p>
      </section>
    </section>

    <section class="dbconnection-creation" v-if="!firstStepEnabled">
      <SettingsTitle title="Generate your Certificate" class="dbconnection-creationform">
        <div slot="pretitle">
          <button class="button__back" style="margin-right: 20px;" @click="goToCertificateList">
            <img class="oauthapps__back" svg-inline src="new-dashboard/assets/icons/apps/back-arrow.svg" />
          </button>
        </div>
      </SettingsTitle>
      <CertificateCreation class="creation__component" @create="onCertificateCreated"></CertificateCreation>
    </section>

    <CertificateDownloadModal :certificate="newCertificate" ref="certificateDownload"></CertificateDownloadModal>
  </section>
</template>

<script>
import { mapState } from 'vuex';

// Components
import CertificateCreation from './CertificateCreation';
import CertificateCard from './CertificateCard';
import CertificateDownloadModal from './CertificateDownloadModal';
import InputList from 'new-dashboard/components/forms/InputList';
import Toggle from 'new-dashboard/components/SettingsUI/Toggle';
import SettingsTitle from 'new-dashboard/components/SettingsUI/SettingsTitle.vue';
import { getCurrentIPAddress } from 'new-dashboard/utils/ip-address';

export default {
  name: 'DBConnectionPage',
  components: {
    CertificateCreation,
    CertificateCard,
    CertificateDownloadModal,
    InputList,
    Toggle,
    SettingsTitle
  },

  data () {
    return {
      firstStepEnabled: true,
      certificateLimit: 5,
      newCertificate: {}
    };
  },

  computed: {
    ...mapState({
      client: state => state.client,
      ipList: state => state.directDBConnection.ip.list,
      certificates: state => state.directDBConnection.certificates.list,
      certificatesLength: state => Object.keys(state.directDBConnection.certificates.list).length
    }),
    canCreateCertificates () {
      return (this.certificatesLength < this.certificateLimit) &&
             (this.ipList && this.ipList.length);
    }
  },

  beforeMount () {
    this.getCurrentIPs();
    this.getCertificates();
  },

  methods: {
    getCertificates () {
      return this.$store.dispatch('directDBConnection/certificates/fetch');
    },

    getCurrentIPs () {
      return this.$store.dispatch('directDBConnection/ip/fetch');
    },

    goToCertificateCreation () {
      this.firstStepEnabled = false;

      this.$nextTick(() => window.scrollTo({ top: 0, left: 0 }));
    },

    goToCertificateList () {
      this.firstStepEnabled = true;
    },

    checkIfIPIsValid (value) {
      // This validation is a hack to
      // add a new IP and validate it
      // in one step
      return this.getCurrentIPs()
        .then(() => {
          const ipListWithNewIp = [...this.ipList, value];
          return this.$store.dispatch('directDBConnection/ip/set', ipListWithNewIp);
        })
        .then(() => ({ isValid: true }))
        .catch(errorText => ({ isValid: false, errorText }));
    },

    onIPRemoved ({ removedElement }) {
      return this.$store.state.client.directDBConnection().getIPs(
        (_1, _2, data) => {
          const newIPList = new Set(data.ips);
          newIPList.delete(removedElement);

          this.$store.dispatch('directDBConnection/ip/set', Array.from(newIPList));
        });
    },

    onCertificateCreated (certificate) {
      this.newCertificate = certificate;
      this.goToCertificateList();
      this.getCertificates();
      this.$refs.certificateDownload.open();
    },

    onCertificateRevoked () {
      this.getCertificates();
    },

    fillDeviceIPAddress () {
      return getCurrentIPAddress()
        .then(ipAddress => {
          this.$refs.ipInputList.fillInputValue(ipAddress);
        });
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.dbconnection {
  font-family: 'Open Sans', sans-serif;

  .strong {
    font-weight: bold;
  }
}

.dbconnection__description {
  margin-bottom: 12px;
  font-size: 12px;
  line-height: 16px;
}

.dbconnection__empty {
  margin-top: 26px;
  font-size: 16px;
  line-height: 24px;
  color: $neutral--600;
}

.dbconnection__ips {
  margin-bottom: 40px;
}

.dbconnection__formsection {
  margin-top: 26px;
  width: 60%
}

.dbconnection__formsection_allowall {
  margin-bottom: 12px;
  font-size: 12px;
  line-height: 16px;
  margin-top: 12px;
}

.dbconnection__certificates {
  margin-top: -1px;
}

.creation__component {
  margin-top: 26px;
}

.dbconnection-creationform {
  padding-top: 0;
}

.dbconnection__tools {
  margin-bottom: 12px;
}

.dbconnection__tool {
  position: relative;
  display: inline-block;
  font-size: 12px;
  line-height: 16px;

  & + & {
    margin-left: 36px;
  }

  .dbconnection__toolimage {
    margin-right: 12px;
    height: 24px;
    vertical-align: middle;
  }
}
</style>
