<template>
  <div class="quota-container">
    <div class="quota-headers">
      <div class="quota-cell cell--main">
        <h3 class="title is-caption quota-title">{{title}}</h3>
      </div>

      <div class="quota-labels">
        <div class="quota-cell cell--medium">
          <p class="text is-small is-txtSoftGrey">{{ $t('QuotaSection.header.remaining') }}</p>
        </div>
        <div class="quota-cell cell--medium cell--mobile">
          <p class="text is-small is-txtSoftGrey">{{ $t('QuotaSection.header.used') }}</p>
        </div>
        <div class="quota-cell cell--medium">
          <p class="text is-small is-txtSoftGrey quota-total">
            {{$t(`QuotaSection.header.total`)}} <span v-if="perMonth" class="quota-month">{{ $t(`QuotaSection.header.perMonth`) }}</span>
          </p>
        </div>
        <div class="quota-cell cell--small"></div>
      </div>
    </div>
    <div class="quota-info">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QuotaContainer',
  props: {
    title: String,
    perMonth: Boolean
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.quota-headers {
  display: flex;
  justify-content: space-between;
}

.quota-title {
  margin-bottom: 8px;
}

.quota-labels {
  display: flex;
}

.quota-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: $white;
}

.quota-cell {
  display: flex;
  align-items: center;
  padding: 0 10px;
  white-space: nowrap;

  &:first-of-type {
    padding-left: 0;
  }

  &:last-of-type {
    padding-right: 0;
  }
}

.cell--mobile {
  @media (max-width: $layout-mobile) {
    display: none;
  }
}

.cell--main {
  min-width: 300px;

  @media (max-width: $layout-mobile) {
    min-width: unset;
  }
}

.cell--medium {
  width: 110px;
}

.cell--small {
  width: 58px;

  @media (max-width: $layout-tablet) {
    display: none;
  }
}

.quota-month {
  &::after {
    content: '*';
  }
}

@media (max-width: $layout-tablet) and (min-width: $layout-mobile) {
  .quota-total {
    &::after {
      content: '*';
    }
  }

  .quota-month {
    display: none;
  }
}
</style>
