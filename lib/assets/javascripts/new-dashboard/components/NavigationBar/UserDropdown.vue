<template>
  <div class="navbar-dropdown" ref="injectionHTMLTemplate"></div>
</template>

<script>
import SettingsDropdown from 'dashboard/components/dashboard-header/settings-dropdown-view';
import $ from 'jquery';

export default {
  name: 'UserDropdown',
  props: {
    userModel: Object,
    configModel: Object
  },
  data: function () {
    return {
      isDropdownOpen: false
    };
  },
  methods: {
    renderView() {
      const settingsDropdown = new SettingsDropdown({
        model: this.$props.userModel,
        configModel: this.$props.configModel,
        className: 'Dropdown vertical_bottom horizontal_right tick_right',
      });

      settingsDropdown.on('onDropdownHidden', () => this.isDropdownOpen = false);

      settingsDropdown.render();

      this.$refs.injectionHTMLTemplate.appendChild(settingsDropdown.el);
      settingsDropdown.show();

      return settingsDropdown;
    },

    show: function () {
      if (!this.$dropdownView) {
        this.$dropdownView = this.renderView();
      }

      this.$dropdownView.show();
      this.isDropdownOpen = true;
    },

    hide: function () {
      this.$dropdownView.hide();
      this.isDropdownOpen = false;
    },

    toggle: function () {
      if (this.isDropdownOpen) {
        this.hide();
      } else if (!this.isDropdownOpen) {
        this.show();
      }
    }
  }
};
</script>
