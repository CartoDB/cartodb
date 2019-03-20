<template>
  <div>
    <img class="brief__icon" svg-inline src="../assets/icons/common/user.svg">
    <span class="brief__text text is-small is-txtSoftGrey" :title="fullText">{{fullText}}</span>
  </div>
</template>

<script>
export default {
  name: 'SharedBrief',
  props: {
    colleagues: Array
  },
  computed: {
    isSharedWithOrg () {
      return this.colleagues.some(colleague => colleague.type === 'org');
    },
    isSharedWithGroups () {
      return this.groups.length > 0;
    },
    isSharedWithUsers () {
      return this.users.length > 0;
    },
    groups () {
      return this.colleagues.filter(colleague => colleague.type === 'group');
    },
    users () {
      return this.colleagues.filter(colleague => colleague.type === 'user');
    },
    userText () {
      return this.$tc(`SharedBrief.users`, this.users.length, { username: this.users[0].entity.username });
    },
    groupText () {
      return this.$tc(`SharedBrief.groups`, this.groups.length, { groupname: this.groups[0].entity.name });
    },
    sharedWithText () {
      const andText = this.$t(`SharedBrief.and`);
      if (this.isSharedWithUsers && this.isSharedWithGroups) {
        return `${this.userText} ${andText} ${this.groupText}`;
      } else if (this.isSharedWithUsers) {
        return `${this.userText}`;
      } else if (this.isSharedWithGroups) {
        return `${this.groupText}`;
      }
    },
    fullText () {
      const colleaguesText = this.isSharedWithOrg ? this.$tc(`SharedBrief.org`) : this.sharedWithText;
      return `${this.$t(`SharedBrief.sharedWith`)} ${colleaguesText}`;
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.brief__icon {
  margin-right: 4px;
  transform: translate(0, 1px);
}

.brief__text {
  line-height: 15px;
  white-space: nowrap;
}

</style>
