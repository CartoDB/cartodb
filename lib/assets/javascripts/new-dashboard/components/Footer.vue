<template>
  <div class="container grid footer">
    <div class="grid-cell grid-cell--col3 grid-cell--col12--mobile footer-logo">
      <a href="https://carto.com">
        <img class="carto-logo" src="../assets/icons/common/cartoLogo.svg">
      </a>
    </div>
    <div class="grid-cell grid-cell--col8 grid-cell--col9--tablet grid-cell--col12--mobile">
      <div class="footer-block">
        <a href="https://carto.com/help" class="footer-link" target="_blank" rel="noopener noreferrer">
          <h4 class="title-link title is-caption is-txtGrey">
            {{ $t(`Footer.HelpCenter.title`) }}<span class="chevron"><img svg-inline src="../assets/icons/common/chevron.svg"/></span>
          </h4>
          <p class="description-link text is-small is-txtSoftGrey">{{ $t(`Footer.HelpCenter.description`) }}</p>
        </a>
        <a href="https://carto.com/developers/" class="footer-link" target="_blank" rel="noopener noreferrer">
          <h4 class="title-link title is-caption is-txtGrey">
            {{ $t(`Footer.DeveloperCenter.title`) }}<span class="chevron"><img svg-inline src="../assets/icons/common/chevron.svg"/></span>
          </h4>
          <p class="description-link text is-small is-txtSoftGrey">{{ $t(`Footer.DeveloperCenter.description`) }}</p>
        </a>
      </div>
      <div class="footer-block">
        <a href="https://gis.stackexchange.com/questions/tagged/carto" class="footer-link" v-if="isFreeUser" target="_blank" rel="noopener noreferrer">
          <h4 class="title-link title is-caption is-txtGrey">
            {{ $t(`Footer.GISStackExchange.title`) }}<span class="chevron"><img svg-inline src="../assets/icons/common/chevron.svg"/></span>
          </h4>
          <p class="description-link text is-small is-txtSoftGrey">{{ $t(`Footer.GISStackExchange.description`) }}</p>
        </a>
        <a href="mailto:support@carto.com" class="footer-link" v-if="isIndividualUser">
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
import * as accounts from 'new-dashboard/core/constants/accounts';

export default {
  name: 'Footer',
  props: {
    user: Object
  },
  computed: {
    userAccountType () {
      return this.user.account_type.toLowerCase();
    },

    free2020Lowecase () {
      return accounts.free2020.map(item => item.toLowerCase());
    },

    freeLowecase () {
      return accounts.free.map(item => item.toLowerCase());
    },

    studentLowecase () {
      return accounts.student.map(item => item.toLowerCase());
    },

    isFreeUser () {
      return this.freeLowecase.includes(this.userAccountType);
    },

    isIndividualUser () {
      const noIndividualUsers = ['internal', 'partner', 'ambassador', ...this.freeLowecase, ...this.free2020Lowecase, ...this.studentLowecase];
      return !(noIndividualUsers.includes(this.userAccountType) || this.user.organization || this.isFreeUser);
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
