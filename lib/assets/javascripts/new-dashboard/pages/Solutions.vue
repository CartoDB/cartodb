<template>
<section class="page is-bgSoftBlue">
  <div class="container grid">
    <h3 class="title is-body solutions-title">{{ $t(`solutionsPage.solutionsTitle`) }}</h3>
    <p class="text is-caption solutions-description">{{ $t(`solutionsPage.solutionsDescription`) }}</p>

    <ul class="grid-cell--col12 grid">
      <li class="grid-cell--col12 solution-element">
        <SolutionsCard
          :title="$t(`solutionsPage.sitePlanning.title`)"
          :description="$t(`solutionsPage.sitePlanning.description`)"
          infoUrl="https://carto.com/solutions/site-planning/"
          demoUrl="https://carto.com/demo/siteplanning-demo/">
          <template slot="solution-icon"><img svg-inline src="../assets/icons/solutions/site-planning.svg"></template>
          <template slot="image"><img src="../assets/icons/solutions/screens/site-planning.png"></template>
          <template slot="demo-logos">
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/dhl.svg"/>
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/securitas.svg"/>
          </template>
        </SolutionsCard>
      </li>

      <li class="grid-cell--col12 solution-element">
        <SolutionsCard
          :title="$t(`solutionsPage.territoryManagement.title`)"
          :description="$t(`solutionsPage.territoryManagement.description`)"
          infoUrl="https://carto.com/solutions/territory-management/"
          demoUrl="https://carto.com/demo/salesquest-demo/">
          <template slot="solution-icon"><img svg-inline src="../assets/icons/solutions/territory.svg"></template>
          <template slot="image"><img src="../assets/icons/solutions/screens/territory.png"></template>
          <template slot="demo-logos">
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/fcc.svg"/>
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/dpd.svg"/>
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/la-poste.svg"/>
          </template>
        </SolutionsCard>
      </li>

      <li class="grid-cell--col12 solution-element">
        <SolutionsCard
          :title="$t(`solutionsPage.logisticsOptimization.title`)"
          :description="$t(`solutionsPage.logisticsOptimization.description`)"
          infoUrl="https://carto.com/solutions/logistics-optimization/"
          demoUrl="https://carto.com/demo/logistic-demo/">
          <template slot="solution-icon"><img svg-inline src="../assets/icons/solutions/logistics.svg"></template>
          <template slot="image"><img src="../assets/icons/solutions/screens/delivery.png"></template>
          <template slot="demo-logos">
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/bonobos.svg"/>
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/ikea.svg"/>
            <img class="demo-card-logo" src="../assets/icons/solutions/logos/sanitas.svg"/>
          </template>
        </SolutionsCard>
      </li>
    </ul>
    <div class="talk-us-card">
      <h3 class="title is-medium">{{ $t(`solutionsPage.talkUsTitle`) }}</h3>
      <p class="text is-caption card-description">{{ $t(`solutionsPage.talkUsDescription`) }}</p>
      <div class="talk-us-button">
        <a href="https://carto.com/request-live-demo/" target="_blank" class="button u-no-decoration">
          <span>{{ $t(`solutionsPage.talkUsButton`) }}</span>
        </a>
      </div>
    </div>
  </div>
</section>
</template>

<script>
import SolutionsCard from 'new-dashboard/components/Solutions/SolutionsCard';

export default {
  name: 'SolutionsPage',
  components: {
    SolutionsCard
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

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
