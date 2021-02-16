<template>
  <div class="guess-private-footer u-pt--32 u-pb--32 u-flex u-flex__justify--between">
    <label class="text u-flex u-flex__align--center">
      <span class="checkbox small u-mr--12">
        <input
          class="checkbox-input"
          type="checkbox"
          v-model="isGuessing"
        />
        <span class="checkbox-decoration">
          <svg
            viewBox="0 0 12 12"
            svg-inline=""
            role="presentation"
            focusable="false"
            tabindex="-1"
            class="checkbox-decorationMedia"
          >
            <path
              d="M1.65 3.803l2.84 3.169L10.38.717"
              fill="none"
              class="checkbox-check"
            ></path>
          </svg>
        </span>
      </span>
      <span class="is-txtMidGrey is-small">{{ $t('DataPage.guessing-desc') }}</span>
    </label>
    <div>
      <button type="button" class="PrivacyToggler u-mr--24" :class="{'PrivacyToggler--PRIVATE ': isPrivate, 'PrivacyToggler--PUBLIC ': !isPrivate}" @click="isPrivate = !isPrivate">
        <i class="CDB-IconFont" :class="{'CDB-IconFont-lock ': isPrivate, 'CDB-IconFont-unlock ': !isPrivate}"></i>
      </button>
      <button class="CDB-Button CDB-Button--primary CDB-Button--big" :class="{'is-disabled ': disabled}" @click="connect">
        <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
          {{ $t('DataPage.connectDataset') }}
        </span>
      </button>
    </div>
  </div>
</template>

<script>

export default {
  name: 'GuessPrivacyFooter',
  components: {},
  props: {
    guess: {
      default: true
    },
    privacy: {
      default: 'PRIVATE'
    },
    disabled: {
      default: true
    }
  },
  computed: {
    isGuessing: {
      get () { return this.guess; },
      set (value) { this.$emit('guessChanged', value); }
    },
    isPrivate: {
      get () { return this.privacy === 'PRIVATE'; },
      set (value) { this.$emit('privacyChanged', value ? 'PRIVATE' : 'PUBLIC'); }
    }
  },
  methods: {
    connect () {
      this.$emit('connect');
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.guess-private-footer {
  border-top: 1px solid #dddddd;
}
</style>
