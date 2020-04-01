<template>
  <div class="certificate-creation">
    <FormInput
      title="Name"
      placeholder="My certificate"
      v-model="certificate.name"></FormInput>

    <FormInput
      title="Password"
      description="Password details."
      v-model="certificate.password"
      :optional="true"></FormInput>

    <FormInput
      title="Confirm Password"
      v-model="certificate.passwordCheck"
      :optional="true"></FormInput>

    <button class="button button--primary" @click="createCertificate(certificate)">
      {{ $t('CertificateCreation.createAction') }}
    </button>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import FormInput from 'new-dashboard/components/forms/FormInput';

export default {
  name: 'CertificateCreation',

  components: {
    FormInput
  },

  data () {
    return {
      certificate: {
        name: '',
        password: '',
        passwordCheck: ''
      },
      hasPasswordError: true,
      passwordError: ''
    };
  },

  computed: mapState({
    client: state => state.client
  }),

  methods: {
    createCertificate (certificate) {
      const passwordIsValid = this.checkIfPasswordsMatch();

      if (!passwordIsValid) {
        return this.setError(this.$t('CertificateCreation.errors.passwordsDoNotMatch'));
      }

      this.resetError();

      const certificateData = {
        name: certificate.name,
        pass: certificate.password,
        server_ca: true
      };

      this.client
        .directDBConnection()
        .createCertificate(
          certificateData,
          (_, _1, certificateMetadata) => this.onCertificateCreated(certificateMetadata)
        );
    },

    onCertificateCreated (certificateMetadata) {
      this.$emit('create', certificateMetadata);
    },

    checkIfPasswordsMatch () {
      return this.certificate.password === this.certificate.passwordCheck;
    },

    setError (errorText) {
      this.hasPasswordError = true;
      this.passwordError = errorText;
    },

    resetError (errorText) {
      this.hasPasswordError = false;
      this.passwordError = '';
    }
  }
};
</script>
