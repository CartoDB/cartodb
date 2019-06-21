<template>
  <div class="container grid footer">
    <div class="grid-cell grid-cell--col3 grid-cell--col12--mobile footer-logo">
      <a href="https://carto.com">
        <img class="carto-logo" src="../assets/icons/common/cartoLogo.svg">
      </a>
    </div>
    <div class="grid-cell grid-cell--col8 grid-cell--col9--tablet grid-cell--col12--mobile">
      <div class="footer-block">
        <a href="https://carto.com/help" class="footer-link" target="_blank">
          <h4 class="title-link title is-caption is-txtGrey">
            {{ $t(`Footer.HelpCenter.title`) }}<span class="chevron"><img svg-inline src="../assets/icons/common/chevron.svg"/></span>
          </h4>
          <p class="description-link text is-small is-txtSoftGrey">{{ $t(`Footer.HelpCenter.description`) }}</p>
        </a>
        <a href="https://carto.com/developers" class="footer-link" target="_blank">
          <h4 class="title-link title is-caption is-txtGrey">
            {{ $t(`Footer.DeveloperCenter.title`) }}<span class="chevron"><img svg-inline src="../assets/icons/common/chevron.svg"/></span>
          </h4>
          <p class="description-link text is-small is-txtSoftGrey">{{ $t(`Footer.DeveloperCenter.description`) }}</p>
        </a>
      </div>
      <div class="footer-block">
        <a href="https://gis.stackexchange.com/questions/tagged/carto" class="footer-link" v-if="isFreeUser" target="_blank">
          <h4 class="title-link title is-caption is-txtGrey">
            {{ $t(`Footer.GISStackExchange.title`) }}<span class="chevron"><img svg-inline src="../assets/icons/common/chevron.svg"/></span>
          </h4>
          <p class="description-link text is-small is-txtSoftGrey">{{ $t(`Footer.GISStackExchange.description`) }}</p>
        </a>
        <a href="mailto:support@carto.com" class="footer-link" v-if="isFreeUser">
          <h4 class="title-link title is-caption is-txtGrey">
            {{ $t(`Footer.TechSupport.title`) }}<span class="chevron"><img svg-inline src="../assets/icons/common/chevron.svg"/></span>
          </h4>
          <p class="description-link text is-small is-txtSoftGrey">{{ $t(`Footer.TechSupport.description`) }}</p>
        </a>
        <a href="mailto:support@carto.com" class="footer-link" v-if="isProUser">
          <h4 class="title-link title is-caption is-txtGrey">
            {{ $t(`Footer.DedicatedSupport.title`) }}<span class="chevron"><img svg-inline src="../assets/icons/common/chevron.svg"/></span>
          </h4>
          <p class="description-link text is-small is-txtSoftGrey">{{ $t(`Footer.DedicatedSupport.description`) }}</p>
        </a>
        <a href="mailto:enterprise-support@carto.com" class="footer-link" v-if="isOrganizationUser">
          <h4 class="title-link title is-caption is-txtGrey">
            {{ $t(`Footer.DedicatedSupport.title`) }}<span class="chevron"><img svg-inline src="../assets/icons/common/chevron.svg"/></span>
          </h4>
          <p class="description-link text is-small is-txtSoftGrey">{{ $t(`Footer.DedicatedSupport.description`) }}</p>
        </a>
        <a :href="`mailto:${organizationMail}`" class="footer-link" v-if="isOrganizationUser && !isOrganizationOwner">
          <h4 class="title-link title is-caption is-txtGrey">
            {{ $t(`Footer.OrganizationAdmin.title`) }}<span class="chevron"><img svg-inline src="../assets/icons/common/chevron.svg"/></span>
          </h4>
          <p class="description-link text is-small is-txtSoftGrey">{{ $t(`Footer.OrganizationAdmin.description`) }}</p>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Footer',
  props: {
    user: Object
  },
  computed: {
    userAccountType () {
      return this.user.account_type.toLowerCase();
    },
    isFreeUser () {
      return this.userAccountType === 'free';
    },

    isProUser () {
      const noProUsers = ['internal', 'partner', 'ambassador', 'free'];
      return !(noProUsers.includes(this.userAccountType) || this.user.organization);
    },

    isOrganizationUser () {
      const organization = this.user.organization;
      return Boolean(organization);
    },

    isOrganizationOwner () {
      return this.user.org_admin;
    },

    organizationMail () {
      const organization = this.user.organization;
      return organization.admin_email;
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';
@import 'new-dashboard/styles/components/_footer';
</style>
