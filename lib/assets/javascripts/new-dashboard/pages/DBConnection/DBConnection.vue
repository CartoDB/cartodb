<template>
  <Page>
    <InputList
      :values="ipList"
      :fieldValidator="checkIfIPIsValid"
      @addElement="onIPsChanged"
      @removeElement="onIPsChanged"></InputList>

    <CertificateCreation @create="onCertificateCreated"></CertificateCreation>

    <section class="certificates">
      <CertificateCard
        v-for="certificate in certificates"
        :key="certificate.id"
        :certificate="certificate"
        @revoke="onCertificateRevoked"></CertificateCard>
    </section>

    <modal name="certificateDownload">
      <div>Name: {{ newCertificate.name }}</div>
      <div>Client Key: {{ newCertificate.client_key }}</div>
      <div>Client CRT: {{ newCertificate.client_crt }}</div>
      <div>Server CA: {{ newCertificate.server_ca }}</div>
    </modal>
  </Page>
</template>

<script>
import { mapState } from 'vuex';
import isIP from 'is-ip';

// Components
import Page from 'new-dashboard/components/Page';
import CertificateCreation from './CertificateCreation';
import CertificateCard from './CertificateCard';
import InputList from 'new-dashboard/components/forms/InputList';

export default {
  name: 'DBConnectionPage',
  components: {
    Page,
    CertificateCreation,
    CertificateCard,
    InputList
  },

  data () {
    return {
      newCertificate: {}
    };
  },

  computed: mapState({
    client: state => state.client,
    ipList: state => state.directDBConnection.ip.list,
    certificates: state => state.directDBConnection.certificates.list
  }),

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

    checkIfIPIsValid (value) {
      const isValid = isIP(value);
      let errorText = '';

      if (!isValid) {
        errorText = this.$t('DBConnectionPage.errors.ipNotValid');
      }

      return { isValid, errorText };
    },

    onIPsChanged (IPs) {
      this.$store.dispatch('directDBConnection/ip/set', IPs.join(','));
    },

    onCertificateCreated (certificate) {
      this.newCertificate = certificate;
      this.$modal.show('certificateDownload');
      this.getCertificates();
    },

    onCertificateRevoked () {
      this.getCertificates();
    }
  }
};
</script>
