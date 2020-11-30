<template>
  <div class="Dialog is-white">
    <button @click="closePoup" class="CDB-Shape Dialog-closeBtn">
      <img src="../../assets/icons/common/close.svg">
    </button>
    <div class="Dialog-contentWrapper Dialog-contentWrapper--withHeaderWrapper">
      <div class="Dialog-header CreateDialog-header with-separator">
        <img class="u-mb--12" height="36" :src="headerImage">
        <h2 class="CDB-Text CDB-Size-large u-mainTextColor">{{headerTitle}}</h2>
      </div>
      <div class="Dialog-body Dialog-body--expanded Dialog-body--create Dialog-body--noPaddingTop Dialog-body--withoutBorder Dialog-body--no-spacing">
        <div class="container grid">
          <div class="grid-cell grid-cell--col12 u-flex u-flex__direction--column">
            <div v-if="showSubHeader" class="u-flex u-flex__justify--between u-flex__align--center u-pt--10 sub-header">
              <button v-if="backText" class="is-small is-semibold is-txtPrimary u-flex u-flex__align--center">
                <img class="u-mr--8" src="../../assets/icons/common/icon-prev-blue.svg">
                {{backText}}
                </button>
                 <slot name="sub-header"></slot>
              <div></div>
            </div>
            <div class="u-mt--32">
              <slot />
            </div>
            <div class="footer">
              <slot name="footer"></slot>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>

export default {
  name: 'Dialog',
  inject: ['backboneViews'],
  components: {},
  props: {
    headerTitle: String,
    headerImage: String,
    showSubHeader: {
      default: true
    },
    backText: {
      default: 'Connect'
    }
  },
  beforeMount () {
    document.body.classList.add('u-overflow-hidden');
    this.backboneViews.mamufasImportView.mamufasView.disable();
  },
  beforeDestroy () {
    document.body.classList.remove('u-overflow-hidden');
    this.backboneViews.mamufasImportView.mamufasView.enable();
  },
  computed: {},
  methods: {
    closePoup () {
      const route = this.$route.matched.slice(-2).shift();
      if (route && route.parent) {
        this.$router.push(route.parent.path);
      }
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.Dialog-header {
  width: 100%;
  min-height: 0 !important;
  padding: 32px 0;
}
.Dialog-body {
  flex: 1 1 0%;
}
.container {
  height: 100%;
}
.sub-header, .footer {
  position: sticky;
  background-color: $neutral--100;
}
.sub-header {
  top: 0px;
  height: 54px;
  border-bottom: 1px solid #dddddd;
}
.footer {
  bottom: 0;
  margin-top: auto;
  margin-bottom: 1px;
}
</style>
