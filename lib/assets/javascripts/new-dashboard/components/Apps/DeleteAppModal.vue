<template>
  <Modal :isOpen="isModalOpen">
    <div class="oauthapps__modal">
      <div class="oauthapps__modal-inner">
        <div class="oauthapps__icon u-mb--24">
          <img svg-inline src="../../assets/icons/apps/default.svg">
          <img class="oauthapps__badge" svg-inline src="../../assets/icons/apps/trash.svg">
        </div>
        <span class="text is-caption u-mb--8" v-html="$t(`OauthAppsPage.deleteModal.title`, { name: app.name })"></span>
        <span class="text is-small is-txtSoftGrey" v-html="$t(`OauthAppsPage.deleteModal.subtitle`)"></span>
        <div class="oauthapps__modal-actions">
          <button class="oauthapps__button button button--ghost u-mr--12" @click="closeModal">{{ $t(`OauthAppsPage.deleteModal.cancelButton`) }}</button>
          <button class="oauthapps__button button button--alert" @click="deleteApp">{{ $t(`OauthAppsPage.deleteModal.deleteButton`) }}</button>
        </div>
      </div>
    </div>
  </Modal>
</template>


<script>
import { mapState } from 'vuex';
import Modal from 'new-dashboard/components/Modal';

export default {
  name: 'DeleteAppModal',
  components: {
    Modal
  },
  // data () {
  //   return {
  //     isModalOpen: false
  //   };
  // },
  props: {
    isModalOpen: Boolean,
    app: Object
  },
  computed: {
    // ...mapState({
    //   // isFetchingApps: state => state.apps.isFetching,
    //   // connectedApps: state => state.apps.connectedApps,
    //   // error: state => state.apps.error,
    //   // isLogoFetching: state => state.apps.isLogoFetching,
    //   // isEditMode () {
    //   //   return this.$route.name === 'oauth_app_edit';
    //   // },
    //   // formTitle () {
    //   //   return this.isEditMode ? this.$t(`OauthAppsPage.form.editTitle`) : this.$t(`OauthAppsPage.form.newTitle`);
    //   // },
    //   // tempLogourl (state) {
    //   //   return state.apps.tempLogoUrl || this.defaultLogoPath;
    //   // },
    //   app () {
    //     if (!this.isEditMode || this.isFetchingApps) {
    //       return {}
    //     }
    //     const selectedApp = this.connectedApps[this.$route.params.id];
    //     return {
    //       ...selectedApp,
    //       callbackUrls: this.redirectUrisToArrayObjects(selectedApp.redirect_uris)
    //     }
    //   }
    // })
   },
  methods: {
    deleteApp () {
      this.$store.dispatch('apps/delete', {
        apiKey: this.$store.state.user.api_key,
        app: this.app
      });
      this.$router.push({ name: 'oauth_apps_list' });
    },
    closeModal () {
      this.isModalOpen = false;
    }
   }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.oauthapps__modal {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 100%;
  height: 100%;
}

.oauthapps__modal-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 960px;
  margin: 0 auto;
  padding: 0;
}

.oauthapps__modal-actions {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 54px;
  padding-top: 38px;
  border-top: 1px solid $neutral--300;
}

.button--ghost {
  padding: 8px 12px;
  border: 1px solid $blue--500;
  background: none;
  color: $blue--500;
}

</style>
