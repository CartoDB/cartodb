<template>
    <div class="subscriptionRequestSuccess">
      <div class="subscriptionRequestSuccess__icon">
         <img svg-inline src="../../assets/icons/catalog/request-success.svg" />
      </div>
      <p ref="subscriptionRequestSuccessText" class="subscriptionRequestSuccess__text text is-small">We have received your request correctly, we will contact you shortly.</p>
    </div>
</template>

<script>
export default {
  name: 'SubscriptionRequestSuccess',
  mounted () {
    this.$nextTick(() => {
      if (this.$refs.subscriptionRequestSuccessText) {
        this.$refs.subscriptionRequestSuccessText.classList.add('animate');
      }
    });
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.subscriptionRequestSuccess {
  display: flex;
  align-items: center;
  width: 290px;

  &__icon {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    margin-top: -4px;

    .circle-path {
      animation: dash 0.5s linear forwards;
      animation-delay: 0s;
      stroke-dasharray: 80;
      stroke-dashoffset: 80;
    }

    .check-path {
      animation: dash 0.5s linear forwards;
      animation-delay: 0s;
      stroke-dasharray: 35;
      stroke-dashoffset: 35;
    }
  }

  &__text {
    margin-left: 24px;
    transition: opacity 1s ease 0.5s;
    opacity: 0;

    &.animate {
      opacity: 1;
    }
  }
}

@keyframes dash {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
