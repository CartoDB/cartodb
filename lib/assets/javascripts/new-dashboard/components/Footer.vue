<template>
  <div class="grid container footer">
    <div class="grid-cell grid-cell--col4">
      <a href="https://carto.com">
        <img class="carto-logo" src="../assets/icons/common/cartoLogo.svg">
      </a>
    </div>
    <div class="grid-cell grid-cell--col4">
      <a href="https://carto.com/help" class="footer-link">
        <h4 class="title-link title is-caption is-txtGrey">Help Center</h4>
        <p class="description-link text is-small is-txtSoftGrey">Check the most frequent questions and Builder Guides.</p>
      </a>
      <a href="https://carto.com/developers" class="footer-link">
        <h4 class="title-link title is-caption is-txtGrey">Developers</h4>
        <p class="description-link text is-small is-txtSoftGrey">Get started building Location Intelligence applications.</p>
      </a>
    </div>
    <div class="grid-cell grid-cell--col4">
      <a href="https://carto.com/help" class="footer-link">
        <h4 class="title-link title is-caption is-txtGrey">Support</h4>
        <p class="description-link text is-small is-txtSoftGrey">Contact CARTO Support if you have any technical issue.</p>
      </a>
      <a href="https://carto.com/help" class="footer-link">
        <h4 class="title-link title is-caption is-txtGrey">Contact</h4>
        <p class="description-link text is-small is-txtSoftGrey">Contact your organization administrator if you need help.</p>
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Footer'
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
  }
}

.carto-logo {
  width: 92px;
}
</style>
