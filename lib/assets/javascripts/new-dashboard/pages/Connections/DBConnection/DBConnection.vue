<template>
  <section class="dbconnection">
    <section class="dbconnection-list" v-if="firstStepEnabled">
      <p class="dbconnection__description">To allow connection to the CARTO database from your desktop GIS applications such as <span class="strong">QGIS</span>, <span class="strong">Tableau</span>, or <span class="strong">Power BI</span>, among others, you'll need to add at least one IP. You can read more in our <a href="#">developer documentation</a>.</p>

      <section class="dbconnection__ips">
        <SettingsTitle title="1. Your IPs"></SettingsTitle>
        <InputList
          class="dbconnection__iplist"
          title="IP addresses"
          description="IP address of your computer or device"
          placeholder="12.12.12.12"
          :values="ipList"
          :fieldValidator="checkIfIPIsValid"
          :addElementToState="false"
          @removeElement="onIPsChanged"></InputList>
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

    <modal name="certificateDownload">
      <div>Name: {{ newCertificate.name }}</div>
      <div>Client Key: {{ newCertificate.client_key }}</div>
      <div>Client CRT: {{ newCertificate.client_crt }}</div>
      <div>Server CA: {{ newCertificate.server_ca }}</div>
    </modal>
  </section>
</template>

<script>
import { mapState } from 'vuex';

// Components
import CertificateCreation from './CertificateCreation';
import CertificateCard from './CertificateCard';
import InputList from 'new-dashboard/components/forms/InputList';
import SettingsTabs from 'new-dashboard/components/Tabs/SettingsTabs.vue';
import SettingsTab from 'new-dashboard/components/Tabs/SettingsTab.vue';
import SettingsTitle from 'new-dashboard/components/SettingsUI/SettingsTitle.vue';

export default {
  name: 'DBConnectionPage',
  components: {
    CertificateCreation,
    CertificateCard,
    InputList,
    SettingsTabs,
    SettingsTab,
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
      this.$modal.show('certificateDownload');
    },

    onCertificateRevoked () {
      this.getCertificates();
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

.dbconnection__iplist {
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
