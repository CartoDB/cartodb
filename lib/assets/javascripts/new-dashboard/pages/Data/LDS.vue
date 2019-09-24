<template>
  <section class="lds-section">
  <div class="container grid">
    <div class="grid-cell grid-cell--col8">
      <SectionTitle class="grid-cell">
        <template slot="icon">
          <img src="../../assets/icons/section-title/lds.svg" width="18" height="20" />
        </template>
         <template slot="title">
            <span>{{ $t('LDSPage.header.title') }}</span>
         </template>
      </SectionTitle>
      <h3 class="text is-body">{{ $t('LDSPage.header.desc') }}</h3>
    </div>
  </div>
  </section>
</template>
  
<script>
import SectionTitle from 'new-dashboard/components/SectionTitle';

export default {
  name: 'LDSPage',
  components: {
    SectionTitle
  }
}
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.lds-section {
  margin-top: 64px;
}

</style>
