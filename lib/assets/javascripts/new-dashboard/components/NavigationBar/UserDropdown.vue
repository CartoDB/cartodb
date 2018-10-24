<template>
  <div class="navbar-dropdown" ref="injectionHTMLTemplate" v-once></div>
</template>

<script>
import SettingsDropdown from 'dashboard/components/dashboard-header/settings-dropdown-view';

export default {
  name: 'UserDropdown',
  props: {
    configModel: Object,
    open: { type: Boolean, default: false },
    userModel: Object
  },
  watch: {
    open (newVisibility) {
      this.toggle(newVisibility);
    }
  },
  mounted () {
    this.$dropdownView = this.renderView();
  },
  methods: {
    renderView () {
      const settingsDropdown = new SettingsDropdown({
        model: this.$cartoModels.user,
        configModel: this.$cartoModels.config,
        className: 'Dropdown SettingsDropdown vertical_bottom horizontal_right tick_right'
      });

      settingsDropdown.on('onDropdownHidden', () => {
        this.$emit('dropdownHidden');
      });

      settingsDropdown.render();

      this.$refs.injectionHTMLTemplate.appendChild(settingsDropdown.el);

      return settingsDropdown;
    },

    show () {
      this.$dropdownView.show();
    },

    hide () {
      this.$dropdownView.hide();
    },

    toggle (setVisible) {
      if (setVisible) {
        this.show();
      } else if (!setVisible) {
        this.hide();
      }
    }
  }
};
</script>

<style lang="scss">
.SettingsDropdown {
  top: 48px;
  right: 1px;
}
</style>
