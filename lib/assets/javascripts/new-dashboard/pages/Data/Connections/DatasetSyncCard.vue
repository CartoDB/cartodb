<template>
  <div class="dataset-sync-card" :class="{'is-active':isActive}">
    <div class="dataset-info u-flex u-flex__align--center">
      <div class="file-type text is-caption u-flex u-flex__align--center u-flex__justify--center">
        {{fileType}}
      </div>
      <div class="dataset-title-container u-ml--12">
        <h4 class="text is-caption card-title" :title="name">{{name}}</h4>
        <p class="text is-small" v-if="size">{{size}}</p>
      </div>
    </div>
    <div class="sync-options u-flex text is-small">
      <p class="">{{$t('DataPage.datasetCard.syncFrequency.title')}}</p>
      <div class="sync-option">
        <input type="radio" id="never" name="syncFrequency" value="never" v-model="selectedInput">
        <label for="never">{{$t('DataPage.datasetCard.syncFrequency.never')}}</label>
      </div>
      <div class="sync-option">
        <input type="radio" id="hour" name="syncFrequency" value="hour" v-model="selectedInput">
        <label for="hour">{{$t('DataPage.datasetCard.syncFrequency.hourly')}}</label>
      </div>
      <div class="sync-option">
        <input type="radio" id="day" name="syncFrequency" value="day" v-model="selectedInput">
        <label for="day">{{$t('DataPage.datasetCard.syncFrequency.daily')}}</label>
      </div>
      <div class="sync-option">
        <input type="radio" id="week" name="syncFrequency" value="week" v-model="selectedInput">
        <label for="week">{{$t('DataPage.datasetCard.syncFrequency.weekly')}}</label>
      </div>
      <div class="sync-option">
        <input type="radio" id="month" name="syncFrequency" value="month" v-model="selectedInput">
        <label for="month">{{$t('DataPage.datasetCard.syncFrequency.monthly')}}</label>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'DatasetSyncCard',
  data () {
    return {
      selectedInput: this.syncFrequency
    };
  },
  model: {
    prop: 'selectedInput',
    event: 'inputChange'
  },
  props: {
    name: String,
    size: String,
    isActive: Boolean,
    fileType: String,
    syncFrequency: {
      type: String,
      default: 'never'
    }
  },
  watch: {
    selectedInput: function (newValue, oldValue) {
      this.$emit('inputChange', newValue);
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.dataset-sync-card {
  padding: 18px;
  transition: border-color 0.2s;
  border: 1px solid $white;
  border-radius: 4px;
  background-color: $white;

  &.is-active {
    border-color: #1785FB;
  }
}

.dataset-info {
  .dataset-sync-card.is-active & {
    padding-bottom: 20px;
    border-bottom: 1px solid #EAEAEA;
  }
}

.file-type {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  transition: all 0.2;
  border: 1px solid #CBCBCB;
  border-radius: 4px;
  color: #CBCBCB;

  .dataset-sync-card.is-active & {
    border-color: #1785FB;
    color: #1785FB;
  }
}

.dataset-title-container {
  flex-grow: 1;
  min-width: 0;
}

.card-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sync-options {
  max-height: 0;
  margin-top: 0;
  overflow: hidden;
  transition: all 0.1s;

  .dataset-sync-card.is-active & {
    max-height: 32px;
    margin-top: 20px;
  }
}

.sync-option {
  display: flex;
  align-items: center;
  margin-left: 20px;
}

.sync-option input {
  -moz-appearance: auto;
  -webkit-appearance: auto;
  appearance: auto;
  margin-right: 4px;
}
</style>
