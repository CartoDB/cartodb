<template>
  <div class="u-flex u-flex__justify--center">
    <div>
      <div class="alert u-pl--36 u-pt--8 u-pb--8 u-pr--8 u-mb--24" v-if="editing">
        <span class="is-small" v-html="$t('ConnectorsPage.editConnectionDisclaimer')"></span>
      </div>
      <h4 class="is-small is-semibold">{{$t('DataPage.imports.database.title', { brand: connector.title })}}</h4>
      <div class="u-flex u-flex__align--center u-flex__justify--between u-mt--24 input-wrapper">
        <label class="is-small u-mr--16">{{$t('DataPage.imports.database.label-name')}}</label>
        <input v-model="connectionModel.name" type="text" :placeholder="$t('DataPage.imports.database.placeholder-name')" :disabled="editing">
      </div>
      <div v-for="p in connector.options.params" :key="p.key" class="u-flex u-flex__align--center u-flex__justify--between u-mt--24 input-wrapper">
        <div class="u-flex u-flex__direction--column u-flex__align--end u-flex__grow--1  u-mr--16">
          <label class="is-small">{{p.key}}</label>
          <span v-if="p.optional" class="is-small is-txtMidGrey">(optional)</span>
        </div>
        <input v-model="connectionModel[p.key]" :type="p.type" :placeholder="$t('DataPage.imports.database.placeholder-' + p.key, { brand: p.title })">
      </div>
      <div class="error-wrapper text is-small is-txtAlert u-flex u-flex__justify--start u-mt--16" v-if="error">
        {{ error }}
      </div>
      <div class="u-flex u-flex__justify--end u-mt--32">
        <button @click="connect" class="CDB-Button CDB-Button--primary CDB-Button--big" :class="{'is-disabled': (!connectionModelIsValid || submited)}">
          <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium">
            {{ editing ? $t('ConnectorsPage.editConnectionButton') : $t('DataPage.connect') }}
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
    editing: Boolean,
    connection: null,
    connector: {
      required: true
    }
  },
  data () {
    return {
      error: '',
      submited: false,
      connectionModel: this.connector.options.params.reduce((accum, current) => {
        accum[current.key] = '';
        return accum;
      }, { name: '', connector: this.connector.options.service })
    };
  },
  computed: {
    connectionModelIsValid () {
      return this.connector.options.params.reduce((accum, current) => {
        return accum && (current.optional || !!this.connectionModel[current.key]);
      }, true);
    },
    originalPassword () {
      return this.connection && this.connection.parameters.password;
    }
  },
  methods: {
    async connect () {
      try {
        this.error = '';
        this.submited = true;
        let id;
        if (this.editing) {
          const params = { ...this.connectionModel };
          if (this.originalPassword === this.connectionModel.password) {
            delete params.password;
          }

          id = await this.$store.dispatch('connectors/editExistingConnection', params);
        } else {
          id = await this.$store.dispatch('connectors/createNewConnection', this.connectionModel);
        }

        this.submited = false;
        this.$emit('connectClicked', id);
      } catch (error) {
        this.submited = false;
        this.error = this.$t('DataPage.imports.database.connection-error');
      }
    }
  },
  watch: {
    connection: {
      immediate: true,
      handler () {
        if (this.editing && this.connection) {
          this.connectionModel = {
            id: this.connection.id,
            name: this.connection.name,
            connector: this.connection.connector,
            ...this.connection.parameters
          };
        }
      }
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.alert {
  position: relative;
  background-color: $yellow--050;
  max-width: 460px;
  border-radius: 22px;

  &:before {
    content: '';
    position: absolute;
    display: block;
    top: 6px;
    left: 10px;
    height: 20px;
    width: 20px;
    background-image: url('../../assets/icons/common/alert.svg');
    background-position: center;
    background-repeat: no-repeat;
    background-size: 16px;
  }
}
.info {
  flex: 0 0 160px;
}
.error-wrapper {
  max-width: 464px;
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
