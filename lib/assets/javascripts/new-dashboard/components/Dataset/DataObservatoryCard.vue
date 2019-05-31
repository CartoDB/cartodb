<template>
  <div class="dataobservatory-card" @click="toggleExpand">
    <div class="u-flex">
      <div class="dataobservatory-type u-mr--16" :class="`dataobservatory-type--${categorySlug}`">
      </div>
      <div class="dataobservatory-information">
        <h3 class="title is-body is-txtGrey">{{$props.dataset.title}}</h3>
      </div>
      <div class="dataobservatory-morebutton">
        <a class="text is-semibold is-small">{{buttonText}}</a>
      </div>
    </div>

    <div class="u-ml--64 dataobservatory-extra-information" :style="`max-height: ${elemHeight}`" :class="{'is-open': isOpen}" ref="expandableElement">
      <p class="text is-caption u-mt--16 u-mb--36">{{$props.dataset.description}}</p>
      <div class="grid grid--align-center">
        <a href="#" class="title is-small u-mr--24 button" @click.stop>{{$t('dataObservatory.viewSample')}}</a>
        <a href="#" class="title is-small button button--outline" @click.stop>{{$t('dataObservatory.interested')}}</a>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DataObservatoryCard',
  data: function () {
    return {
      isOpen: false
    };
  },
  props: {
    dataset: Object
  },
  computed: {
    categorySlug () {
      let category = this.$props.dataset.category;
      return category.toLowerCase().replace(/\s+/g, '-');
    },
    buttonText () {
      return this.isOpen ? this.$t('dataObservatory.close') : this.$t('dataObservatory.viewMore');
    },
    maxExpandableHeight () {
      const realHeight = this.$refs.expandableElement.scrollHeight;
      return `${realHeight}px`;
    },
    elemHeight () {
      if (this.isOpen) {
        return this.maxExpandableHeight;
      } else {
        return '0';
      }
    }
  },
  methods: {
    toggleExpand () {
      this.isOpen = !this.isOpen;
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.dataobservatory-card {
  padding: 22px 36px 22px 24px;
  border: 1px solid $neutral--300;
  border-radius: 4px;
  cursor: pointer;
}

.dataobservatory-information {
  display: flex;
  flex-grow: 1;
  align-items: center;
}

.dataobservatory-morebutton {
  flex-shrink: 0;
  align-self: center;
  width: 64px;
  text-align: right;
}

.dataobservatory-type {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 2px;
  background-repeat: no-repeat;

  &--financial {
    background-image: url("../../assets/icons/datasets/data-observatory/data-types/finance.svg");
  }
  &--demographics {
    background-image: url("../../assets/icons/datasets/data-observatory/data-types/finance.svg"); //CHANGE
  }
}

.dataobservatory-extra-information {
  // max-height: 0;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0.01, 0.165, 0.99);

  // &.is-open {
  //   max-height: 100%;
  // }
}

</style>
