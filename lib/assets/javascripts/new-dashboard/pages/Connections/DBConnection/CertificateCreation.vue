<template>
  <form class="certificate-creation" @submit.prevent="createCertificate(certificate)">
    <FormInput
      class="field__name"
      title="Name"
      placeholder="My certificate"
      v-model="certificate.name"></FormInput>

    <div class="certificate-creation__passwordprotected">
      <Toggle label="Password protected" v-model="passwordProtected"></Toggle>

      <div class="certificate-creation__passwordfields" v-if="passwordProtected">
        <FormInput
          class="field__password"
          title="Password"
          type="password"
          v-model="certificate.password"
          :optional="true">
          <p v-if="hasPasswordError">{{ passwordError }}</p>
        </FormInput>

        <FormInput
          class="field__password"
          title="Confirm Password"
          type="password"
          v-model="certificate.passwordCheck"
          :optional="true"></FormInput>
      </div>
    </div>

    <div class="certificate-creation__footer">
      <p class="footer__text">
        You can download the file and copy the code once the certificate is generated.
      </p>
      <button class="button button--primary" :disabled="isCreatingCertificate">
        {{ this.isCreatingCertificate
           ? $t('CertificateCreation.creatingAction')
           : $t('CertificateCreation.createAction') }}
      </button>
    </div>
  </form>
</template>

<script>
import { mapState } from 'vuex';
import FormInput from 'new-dashboard/components/forms/FormInput';
import Toggle from 'new-dashboard/components/SettingsUI/Toggle';

export default {
  name: 'CertificateCreation',

  components: {
    FormInput,
    Toggle
  },

  data () {
    return {
      certificate: {
        name: '',
        password: '',
        passwordCheck: ''
      },
      isCreatingCertificate: false,
      passwordProtected: false,
      hasPasswordError: false,
      passwordError: ''
    };
  },

  computed: mapState({
    client: state => state.client
  }),

  methods: {
    createCertificate (certificate) {
      this.isCreatingCertificate = true;
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
          (_, _1, certificateMetadata) => {
            this.onCertificateCreated(certificateMetadata);
            this.isCreatingCertificate = false;
          }
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

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.certificate-creation__passwordprotected {
  margin-top: 26px;
}

.certificate-creation__passwordfields {
  display: flex;
  margin-top: 26px;
}

.field__name {
  width: calc(50% - 10px);
}

.field__password {
  flex: 1 0 auto;

  &:last-child {
    margin-left: 20px;
  }
}

.certificate-creation__footer {
  display: flex;
  align-items: center;
  margin-top: 48px;
  border-top: 1px solid $settings_border-color;
  padding-top: 26px;

  .footer__text {
    flex: 1 1 auto;
    font-size: 12px;
    color: $neutral--600;
    text-align: right;
    padding-right: 40px;
  }

  .button {
    flex: 1 0 auto;
  }
}
</style>
