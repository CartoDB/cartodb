<template>
  <div>
    <div class="CDB-Text Dialog-header u-inner">
      <div class="Dialog-headerIcon Dialog-headerIcon--negative">
        <i class="CDB-IconFont CDB-IconFont-trash"></i>
        <span class="Badge Badge--negative Dialog-headerIconBadge CDB-Text CDB-Size-small">{{ visualizations.length }}</span>
      </div>
      <div>
        <h2 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m u-tSpace-xl">
          {{ $tc(
              'ExternalMapsPage.deleteModal.title',
              visualizations.length,
              {
                name: visualizations.length > 1 ? visualizations.length : visualizations[0].name
              }
            )
          }}
        </h2>
        <p class="CDB-Text CDB-Size-medium u-altTextColor">{{ $tc('ExternalMapsPage.deleteModal.desc', visualizations.length) }}</p>
      </div>
    </div>
    <div class="Dialog-footer Dialog-footer--simple u-inner">
      <div class="Dialog-footerContent MapsList-footer">
        <button class="CDB-Button CDB-Button--secondary cancel" @click="close">
          <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">
            {{ $t('ExternalMapsPage.deleteModal.cancel') }}
          </span>
        </button>
        <button class="u-lSpace--xl CDB-Button CDB-Button--error ok" @click="deleteMap">
          <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">
            {{ $t('ExternalMapsPage.deleteModal.confirm') }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
export default {
  name: 'DeleteExternalMapsDialog',
  computed: {
    ...mapState({
      mapsList: state => state.externalMaps.list
    })
  },
  props: {
    visualizations: Array
  },
  methods: {
    deleteMap () {
      this.$store.dispatch('externalMaps/delete', this.visualizations);
    },
    close () {
      this.$emit('close');
    }
  },
  watch: {
    mapsList () {
      this.$emit('close');
    }
  }
};
</script>
