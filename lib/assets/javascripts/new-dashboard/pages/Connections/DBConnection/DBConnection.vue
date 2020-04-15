<template>
  <section class="dbconnection">
    <section class="dbconnection-list" v-if="firstStepEnabled">
      <p class="dbconnection__description">To allow connection to the CARTO database from your desktop GIS applications such as <span class="strong">QGIS</span>, <span class="strong">Tableau</span>, or <span class="strong">Power BI</span>, among others, you'll need to add at least one IP. You can read more in our <a href="#">developer documentation</a>.</p>

      <section class="dbconnection__ips">
        <SettingsTitle title="1. Your IPs"></SettingsTitle>

        <Toggle
          :disabled="true"
          class="dbconnection__formsection"
          label="Allow connections from any IP addresses">
        </Toggle>

        <InputList
          ref="ipInputList"
          class="dbconnection__formsection"
          title="Allowed IP addresses"
          placeholder="12.12.12.12"
          :values="ipList"
          :fieldValidator="checkIfIPIsValid"
          :addElementToState="false"
          @removeElement="onIPsChanged">
          Computer or device IP address.
          <a href="javascript:void(0)" @click="fillDeviceIPAddress">Get your IP address</a>.
        </InputList>
      </section>

      <SettingsTitle :title="`2. Your certificates (${certificatesLength} of ${certificateLimit})`">
        <div slot="actions">
          <button
            class="button button--small"
            :disabled="!canCreateCertificates"
            @click="goToCertificateCreation">New Certificate</button>
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
          You have not generated any certificates yet.
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
      certificateLimit: 3,
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
      this.$store.dispatch('directDBConnection/certificates/fetch');
    },

    getCurrentIPs () {
      this.$store.dispatch('directDBConnection/ip/fetch');
    },

    goToCertificateCreation () {
      this.firstStepEnabled = false;
    },

    goToCertificateList () {
      this.firstStepEnabled = true;
    },

    checkIfIPIsValid (value) {
      // This validation is a hack to
      // add a new IP and validate it
      // in one step
      const ipListWithNewIp = [
        ...this.ipList,
        value
      ];

      return this.$store.dispatch('directDBConnection/ip/set', ipListWithNewIp)
        .then(() => ({ isValid: true }))
        .catch(errorData => ({ isValid: false, errorText: errorData.errors.ips.join('. ') }));
    },

    onIPsChanged (IPs) {
      this.$store.dispatch('directDBConnection/ip/set', IPs);
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
  margin-bottom: 20px;
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

.dbconnection__certificates {
  margin-top: -1px;
}

.creation__component {
  margin-top: 26px;
}

.dbconnection-creationform {
  padding-top: 0;
}
</style>
