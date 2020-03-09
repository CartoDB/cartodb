<template>
<Page class="is-bgSoftBlue">
  <div class="container grid grid__content">
    <h3 class="title is-body solutions-title">{{ $t(`SolutionsPage.solutionsTitle`) }}</h3>
    <p class="text is-caption solutions-description">{{ $t(`SolutionsPage.solutionsDescription`) }}</p>

    <ul class="grid-cell--col12 grid">
      <li class="grid-cell--col12 solution-element">
        <SolutionCard
          :title="$t(`SolutionsPage.sitePlanning.title`)"
          :description="$t(`SolutionsPage.sitePlanning.description`)"
          infoUrl="https://carto.com/solutions/site-planning/"
          demoUrl="https://carto.com/demo/siteplanning-demo/">
          <template slot="icon"><img svg-inline src="../assets/icons/solutions/site-planning.svg"></template>
          <template slot="image"><img src="../assets/icons/solutions/screens/site-planning.png"></template>
          <template slot="demo-logos">
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/dhl.svg"/>
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/securitas.svg"/>
          </template>
        </SolutionCard>
      </li>

      <li class="grid-cell--col12 solution-element">
        <SolutionCard
          :title="$t(`SolutionsPage.territoryManagement.title`)"
          :description="$t(`SolutionsPage.territoryManagement.description`)"
          infoUrl="https://carto.com/solutions/territory-management/"
          demoUrl="https://carto.com/demo/salesquest-demo/">
          <template slot="icon"><img svg-inline src="../assets/icons/solutions/territory.svg"></template>
          <template slot="image"><img src="../assets/icons/solutions/screens/territory.png"></template>
          <template slot="demo-logos">
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/fcc.svg"/>
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/dpd.svg"/>
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/la-poste.svg"/>
          </template>
        </SolutionCard>
      </li>

      <li class="grid-cell--col12 solution-element">
        <SolutionCard
          :title="$t(`SolutionsPage.logisticsOptimization.title`)"
          :description="$t(`SolutionsPage.logisticsOptimization.description`)"
          infoUrl="https://carto.com/solutions/logistics-optimization/"
          demoUrl="https://carto.com/demo/logistic-demo/">
          <template slot="icon"><img svg-inline src="../assets/icons/solutions/logistics.svg"></template>
          <template slot="image"><img src="../assets/icons/solutions/screens/delivery.png"></template>
          <template slot="demo-logos">
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/bonobos.svg"/>
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/ikea.svg"/>
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/sanitas.svg"/>
          </template>
        </SolutionCard>
      </li>
    </ul>
    <div class="talk-us-card">
      <h3 class="title is-medium">{{ $t(`SolutionsPage.talkUsTitle`) }}</h3>
      <p class="text is-caption card-description">{{ $t(`SolutionsPage.talkUsDescription`) }}</p>
      <div class="talk-us-button">
        <a href="https://carto.com/request-live-demo/" target="_blank" rel="noopener noreferrer" class="button u-no-decoration">
          <span>{{ $t(`SolutionsPage.talkUsButton`) }}</span>
        </a>
      </div>
    </div>
  </div>
</Page>
</template>

<script>
import Page from 'new-dashboard/components/Page';
import SolutionCard from 'new-dashboard/components/Solutions/SolutionCard';

export default {
  name: 'SolutionsPage',
  components: {
    Page,
    SolutionCard
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.solutions-title {
  width: 100%;
  margin-bottom: 16px;
  font-size: 24px;
  line-height: 32px;
  text-align: center;
}

.solutions-description {
  max-width: 615px;
  margin-right: auto;
  margin-left: auto;
  text-align: center;
}

.talk-us-card {
  width: 100%;
  margin-top: 64px;
  padding: 36px 28px;
  border-radius: 2px;
  background-color: $white;
}

.card-description {
  max-width: 561px;
  margin-top: 8px;
  margin-bottom: 24px;
}

.talk-us-button {
  display: flex;
}

.solution-element {
  margin-top: 48px;
}
</style>
