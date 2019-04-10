<template>
  <canvas id="congrats-confetti"></canvas>
</template>

<script>
import 'confetti-js';

export default {
  name: 'Confetti',
  mounted () {
    const canvasBoundingRect = this.$el.getBoundingClientRect();

    const confettiSettings = {
      target: 'congrats-confetti',
      max: 250,
      size: 1,
      animate: true,
      props: ['square'],
      colors: [
        [41, 106, 166],
        [140, 193, 64],
        [219, 44, 111],
        [88, 178, 85],
        [56, 78, 144],
        [84, 189, 199],
        [59, 82, 147],
        [134, 191, 65],
        [89, 177, 70],
        [127, 72, 139],
        [241, 170, 73],
        [142, 194, 64],
        [63, 92, 154],
        [241, 170, 73],
        [90, 72, 139],
        [210, 34, 126],
        [209, 36, 42],
        [66, 187, 206],
        [211, 32, 122],
        [201, 215, 56],
        [212, 22, 124],
        [125, 42, 121],
        [252, 236, 38],
        [152, 122, 169]
      ],
      clock: 35,
      rotate: true,
      width: canvasBoundingRect.width,
      height: canvasBoundingRect.height
    };

    // confetti-js exports function to global scope 🤦‍♂️
    this.confetti = new window.ConfettiGenerator(confettiSettings);
    this.confetti.render();
  },
  beforeDestroy () {
    this.confetti.clear();
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

#congrats-confetti {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: $onboarding-congrats__height;
  pointer-events: none;
}
</style>
