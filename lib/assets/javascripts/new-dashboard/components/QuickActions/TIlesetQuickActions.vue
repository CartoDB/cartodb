<template>
  <QuickActions
    :actions="actions[actionMode]"
    v-on="getEventListeners()"
    ref="quickActions"
    @open="openQuickactions"
    @close="closeQuickactions" />
</template>

<script>
import QuickActions from 'new-dashboard/components/QuickActions/QuickActions';

export default {
  name: 'TilesetQuickActions',
  inject: ['backboneViews'],
  components: {
    QuickActions
  },
  props: {
    tileset: Object,
    storeActionType: {
      type: String,
      default: 'datasets'
    },
    isSharedWithMe: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    actions () {
      return {
        mine: [
          {
            name: this.$t('QuickActions.changePrivacy'),
            event: 'changePrivacy',
            shouldBeHidden: this.isSubscription
          }
        ]
      };
    },
    actionMode () {
      return 'mine';
    },
    isSubscription () {
      return false;
    }
  },
  methods: {
    changePrivacy () {

    },
    getActionHandlers () {
      return {
      };
    },
    getEventListeners () {
      const events = this.actions[this.actionMode].map(action => action.event);

      return events.reduce(
        (eventListeners, action) => {
          eventListeners[action] = this[action].bind(this);
          return eventListeners;
        }, {}
      );
    },
    showModal (componentDefinition, componentPropsData) {
      this.$modal.show(
        componentDefinition,
        componentPropsData,
        { width: '100%', height: '100%' }
      );
    },
    openQuickactions () {
      this.$emit('open');
    },
    closeQuickactions () {
      this.$emit('close');
    },
    closeDropdown () {
      this.$refs.quickActions.closeDropdown();
    }
  }
};
</script>
