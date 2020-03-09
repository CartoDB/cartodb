<template>
  <div class="warning">
    <span class="text is-small">
      {{$t(`Wizards.Distributor.engineWarning.text`)}} <a target="_blank" class="warning__link" :href="$t(`Wizards.Distributor.engineWarning.link`)" rel="noopener noreferrer">{{$t(`Wizards.Distributor.engineWarning.linkText`)}}</a>
    </span>
  </div>
</template>

<script>
export default {
  name: 'Warning'
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.warning {
  display: flex;
  align-items: center;
  max-width: 460px;
  height: 34px;
  padding: 1.3em;
  border-bottom-right-radius: 2px;
  border-bottom-left-radius: 2px;
  background-color: $primary-color;
  color: $white;

  &__link {
    color: $white;
    text-decoration: underline;
  }
}
</style>
