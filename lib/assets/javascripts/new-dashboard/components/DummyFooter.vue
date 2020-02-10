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
        <a href="mailto:support@carto.com" class="footer-link">
          <h4 class="title-link title is-caption is-txtGrey">
            {{ $t(`Footer.TechSupport.title`) }}<span class="chevron"><img svg-inline src="../assets/icons/common/chevron.svg"/></span>
          </h4>
          <p class="description-link text is-small is-txtSoftGrey">{{ $t(`Footer.TechSupport.description`) }}</p>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DummyFooter'
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';
@import 'new-dashboard/styles/components/_footer';
</style>
