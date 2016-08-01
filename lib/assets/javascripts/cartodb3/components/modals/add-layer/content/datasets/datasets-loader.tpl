<div class="IntermediateInfo">
  <div class="CDB-LoaderIcon CDB-LoaderIcon--big is-dark js-loader">
    <svg class="CDB-LoaderIcon-spinner" viewbox="0 0 50 50">
      <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"/>
    </svg>
  </div>
  <h4 class="CDB-Text CDB-Size-large u-mainTextColor u-bSpace u-secondaryTextColor u-tSpace-xl">
    <%- _t('components.modals.add-layer.datasets.' + (q || tag  ? 'searching' : 'loading')) %>...
  </h4>
  <div class="CDB-Text CDB-Size-medium u-altTextColor"><%= quote %></div>
</div>
