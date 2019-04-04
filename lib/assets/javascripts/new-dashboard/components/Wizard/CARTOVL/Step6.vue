<template>
<div class="congrats">
  <div class="congrats__hero">
    <img svg-inline src="../../../assets/icons/wizard/congrats.svg" alt="">
    <h2 class="title is-body u-mb--16 u-mt--24 ">{{ $t(`Wizards.cartovl.step6.congrats.title`) }}</h2>
    <p v-html="$t(`Wizards.cartovl.step6.congrats.message1`)" class="text is-caption"></p>
    <p v-html="$t(`Wizards.cartovl.step6.congrats.message2`)" class="text is-caption"></p>
  </div>
  <div class="container u-mt--64 u-pb--80">
    <StepTitle :title="$t(`Wizards.cartovl.sections.learnmore`)">
        <template slot="icon">
            <img svg-inline src="../../../assets/icons/wizard/learn.svg"/>
        </template>
      </StepTitle>
      <p v-html="$t(`Wizards.cartovl.step5.extras.resource1`)" class="text is-caption u-mt--16 u-mb--64"></p>
      <TutorialCard :content="$t(`Wizards.cartovl.step6.cards.card1`)" class="u-mb--16">
        <img src="../../../assets/images/wizards/stylefeatures.png" width="240" height="130" alt="Style features by category sample image"/>
      </TutorialCard>
      <TutorialCard :content="$t(`Wizards.cartovl.step6.cards.card2`)" class="u-mb--16">
        <img src="../../../assets/images/wizards/hoverpopups.png" width="240" height="130" alt="Add hover popups sample image"/>
      </TutorialCard>
      <TutorialCard :content="$t(`Wizards.cartovl.step6.cards.card3`)">
        <img src="../../../assets/images/wizards/animatefeatures.png" width="240" height="130" alt="Animate the features sample image"/>
      </TutorialCard>
  </div>
</div>
</template>
<script>
import StepTitle from 'new-dashboard/components/Wizard/StepTitle.vue';
import TutorialCard from 'new-dashboard/components/Wizard/TutorialCard.vue';

export default {
  name: 'Step6',
  components: {
    StepTitle,
    TutorialCard
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.congrats {
  background-color: $white;

  &__hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 445px;
    background-color: #CBE4FF;
    background-image: url(../../../assets/icons/wizard/confetti.svg);
    background-repeat: repeat no-repeat;
    background-position: center -145px;
  }
}
</style>
