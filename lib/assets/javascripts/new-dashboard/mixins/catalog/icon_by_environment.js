const icons = {
  'empty-search.svg': {
    purple: require('new-dashboard/assets/icons/catalog/empty-search.svg'),
    blue: require('new-dashboard/assets/icons/catalog/empty-search_blue.svg')
  },
  'arrow-blue.svg': {
    purple: require('new-dashboard/assets/icons/catalog/arrow-blue.svg'),
    blue: require('new-dashboard/assets/icons/catalog/arrow-blue_blue.svg')
  },
  'close-tag.svg': {
    purple: require('new-dashboard/assets/icons/catalog/close-tag.svg'),
    blue: require('new-dashboard/assets/icons/catalog/close-tag_blue.svg')
  }
};
export default {
  methods: {
    icon_by_environment (icon) {
      return icons[icon][process.env.VUE_APP_COLOR_PRIMARY ? 'purple' : 'blue'];
    }
  }
};
