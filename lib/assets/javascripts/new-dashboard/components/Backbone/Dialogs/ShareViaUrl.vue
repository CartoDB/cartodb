<template>
  <div class="Dialog-content Dialog-content--expanded" ref="injectionHTMLElement">
    <div class="CDB-Text Dialog-header u-inner">
      <button class="Dialog-backBtn u-actionTextColor" @click="close">
        <i class="CDB-IconFont CDB-IconFont-arrowPrev"></i>
      </button>

      <div class="Dialog-headerIcon Dialog-headerIcon--neutral">
        <i class="CDB-IconFont CDB-IconFont-unlock"></i>
      </div>
      <p class="Dialog-headerTitle u-ellipsLongText">{{vizName}} {{ $t('Dialogs.ShareViaURL.map') }}</p>
      <p class="Dialog-headerText">{{ $t('Dialogs.ShareViaURL.headerText') }}</p>
    </div>

    <div class="Publish-modalBody is-simple">
      <div class="Publish-modalShadow"></div>
      <div class="Publish-modalShare u-inner" ref="injectionContent"></div>
    </div>

    <div class="Dialog-stickyFooter u-flex">
      <div class="Dialog-shareViaUrl-footer Dialog-footer u-inner">
        <button class="CDB-Button CDB-Button--secondary" @click="close">
          <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">{{ $t('Dialogs.ShareViaURL.close') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import PublishViewDialog from 'builder/components/modals/publish/publish/publish-view';
import VisualizationModel from 'builder/data/vis-definition-model';

export default {
  name: 'ShareViaUrl',
  props: {
    visualization: Object
  },
  mounted () {
    this.dialog = this.renderDialog();
  },
  beforeDestroy () {
    this.dialog.clean();
  },
  computed: {
    vizName () {
      return this.$props.visualization.name;
    }
  },
  methods: {
    renderDialog () {
      const visDefinitionModel = new VisualizationModel(
        this.$props.visualization,
        { configModel: this.$cartoModels.config }
      );

      visDefinitionModel.on('change', model => {
        this.$emit('deselectAll');
      });

      const publishViewDialog = new PublishViewDialog({
        visDefinitionModel,
        userModel: this.$cartoModels.user,
        el: this.$refs.injectionContent
      });

      publishViewDialog.render();
      return publishViewDialog;
    },

    close () {
      this.$emit('close');
    }
  }
};
</script>

<style lang="scss">
@import 'new-dashboard/styles/variables';
@import 'assets/stylesheets/editor-3/_cards.scss';

.Dialog-shareViaUrl-footer.Dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin: 10px auto;
  border-top: 1px solid $border-color;
}
</style>
