<template>
  <div class="grid container footer">
    <div class="grid-cell grid-cell--col4">
      <a href="https://carto.com">
        <img class="carto-logo" src="../assets/icons/common/cartoLogo.svg">
      </a>
    </div>
    <div class="grid-cell grid-cell--col4">
      <a href="https://carto.com/help" class="footer-link" target="_blank" >
        <h4 class="title-link title is-caption is-txtGrey">
          Help Center<span class="chevron"><img svg-inline src="../assets/icons/common/chevron.svg"/></span>
        </h4>
        <p class="description-link text is-small is-txtSoftGrey">Check the most frequent questions and Builder Guides.</p>
      </a>
      <a href="https://carto.com/developers" class="footer-link" target="_blank" >
        <h4 class="title-link title is-caption is-txtGrey">
          Developers<span class="chevron"><img svg-inline src="../assets/icons/common/chevron.svg"/></span>
        </h4>
        <p class="description-link text is-small is-txtSoftGrey">Get started building Location Intelligence applications.</p>
      </a>
    </div>
    <div class="grid-cell grid-cell--col4">
      <a href="mailto:support@carto.com" class="footer-link" target="_blank" >
        <h4 class="title-link title is-caption is-txtGrey">
          Support<span class="chevron"><img svg-inline src="../assets/icons/common/chevron.svg"/></span>
        </h4>
        <p class="description-link text is-small is-txtSoftGrey">Contact CARTO Support if you have any technical issue.</p>
      </a>
      <a :href="`mailto:${organizationMail}`" class="footer-link" v-if="isOrganizationUser" target="_blank" >
        <h4 class="title-link title is-caption is-txtGrey">
          Contact<span class="chevron"><img svg-inline src="../assets/icons/common/chevron.svg"/></span>
        </h4>
        <p class="description-link text is-small is-txtSoftGrey">Contact your organization administrator if you need help.</p>
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Footer',
  computed: {
    isOrganizationUser () {
      const organization = this.$store.state.user.organization;
      return Boolean(organization);
    },

    organizationMail () {
      const organization = this.$store.state.user.organization;
      return organization.admin_email;
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.footer {
  padding-top: 64px;
  padding-bottom: 100px;
}

.footer-link {
  display: block;
  margin-bottom: 48px;

  &:hover {
    text-decoration: none;

    .title-link {
      color: $primary-color;
    }

    .chevron .chevron-path {
      fill: $primary-color;
    }
  }

  .chevron {
    display: inline-block;
    margin-left: 8px;
  }
}

.carto-logo {
  width: 92px;
}
</style>
