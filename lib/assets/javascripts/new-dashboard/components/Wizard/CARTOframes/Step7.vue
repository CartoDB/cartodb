<template>
<div class="congrats">
  <div class="congrats__hero">
    <Confetti></Confetti>
    <img svg-inline src="../../../assets/icons/wizard/congrats.svg" alt="">
    <h2 class="title is-body u-mb--16 u-mt--24 ">{{ $t(`Wizards.cartoframes.step7.congrats.title`) }}</h2>
      <p v-html="$t(`Wizards.cartoframes.step7.congrats.message1`)" class="text is-caption"></p>
      <p v-html="$t(`Wizards.cartoframes.step7.congrats.message2`)" class="text is-caption"></p>
  </div>
  <div class="container u-mt--64 u-pb--80">
      <StepTitle :title="'Learn More'">
        <template slot="icon">
            <img svg-inline src="../../../assets/icons/wizard/learn.svg"/>
        </template>
      </StepTitle>
      <p v-html="$t(`Wizards.cartoframes.step7.extras.resource1`)" class="text is-caption u-mt--16 u-mb--16"></p>
      <TutorialCard :content="$t(`Wizards.cartoframes.step7.cards.card1`)" class="u-mb--16">
        <img src="../../../assets/images/wizards/basicexample.png" width="240" height="130" alt="Style features by category sample image"/>
      </TutorialCard>
      <TutorialCard :content="$t(`Wizards.cartoframes.step7.cards.card2`)" class="u-mb--16">
        <img src="../../../assets/images/wizards/geopandas.png" width="240" height="130" alt="Add hover popups sample image"/>
      </TutorialCard>
      <TutorialCard :content="$t(`Wizards.cartoframes.step7.cards.card3`)">
        <img src="../../../assets/images/wizards/citibike.png" width="240" height="130" alt="Animate the features sample image"/>
      </TutorialCard>
  </div>
</div>
</template>
<script>
import StepTitle from 'new-dashboard/components/Wizard/StepTitle.vue';
import TutorialCard from 'new-dashboard/components/Wizard/TutorialCard.vue';
import Confetti from 'new-dashboard/components/Wizard/Confetti.vue';

export default {
  name: 'Step7',
  components: {
    StepTitle,
    TutorialCard,
    Confetti
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.congrats {
  background-color: $white;

  &__hero {
    display: flex;
    position: relative;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: $onboarding-congrats__height;
    background-color: $onboarding-congrats__bg-color;
  }

  &__hero-content {
    display: flex;
    position: relative;
    z-index: 1;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
}

</style>
