<template>
  <div class="u-flex u-flex__justify--center">
    <div>
      <h4 class="is-small is-semibold">{{$t('DataPage.imports.database.title', { brand: connector.title })}}</h4>
      <div v-for="p in connector.options.params" :key="p.key" class="u-flex u-flex__align--center u-flex__justify--between u-mt--24 input-wrapper">
        <label class="is-small u-mr--16">{{p.key}}</label>
        <input v-model="conexionModel[p.key]" :type="p.type" :placeholder="$t('DataPage.imports.database.placeholder-' + p.key, { brand: p.title })">
      </div>
      <div class="u-flex u-flex__justify--end u-mt--32">
        <button @click="connect" class="CDB-Button CDB-Button--primary CDB-Button--big" :class="{'is-disabled': !conexionModelIsValid}">
        <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
          {{ $t('DataPage.connect') }}
        </span>
      </button>
      </div>
    </div>
    <div class="info u-ml--80 ">
      <h4 class="is-small is-semibold u-mb--8">{{ $t('DataPage.gettingConnected') }}</h4>
      <p class="u-mt--10 is-txtMidGrey is-small">
        {{ $t('DataPage.connectInfo') }}
      </p>
      <div class="ports u-pt--16 u-pb--16 u-pl--24 u-pr--24 u-mt--16 is-txtMidGrey is-small u-flex u-flex__direction--column u-flex__justify--between">
        <span>54.68.30.98</span>
        <span> 54.68.45.3</span>
        <span>54.164.204.122</span>
        <span>54.172.100.146</span>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'DatabaseConnectionForm',
  components: {},
  props: {
    connector: {
      required: true
    }
  },
  data () {
    return {
      conexionModel: this.connector.options.params.reduce((accum, current) => {
        accum[current.key] = '';
        return accum;
      }, {})
    };
  },
  computed: {
    conexionModelIsValid () {
      return this.connector.options.params.reduce((accum, current) => {
        return accum && (current.optional || !!this.conexionModel[current.key]);
      }, true);
    }
  },
  methods: {
    connect () {
      this.$emit('connectClicked', {...this.conexionModel});
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.info {
  flex: 0 0 160px;
}
.ports {
  border: solid 1px #dddddd;
  border-radius: 4px;
  height: 109px;
}
.input-wrapper {
  label {
    flex: 1;
    text-align: right;
    text-transform: capitalize;
  }
  input {
    width: 385px;
    border: solid 1px #dddddd;
    border-radius: 4px;
    background-color: $white;
    font-size: 12px;
    color: $neutral--800;
    padding: 12px;
    height: 40px;
    &::placeholder {
      color: rgba(46, 60, 67, 0.48);
    }

    &:-ms-input-placeholder {
      color: rgba(46, 60, 67, 0.48);
    }

    &::-ms-input-placeholder {
      color: rgba(46, 60, 67, 0.48);
    }
  }
}
</style>
