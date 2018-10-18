<div class="ServiceList-itemExt u-ellipsLongText CDB-Text CDB-Size-medium u-rSpace--xl">
  <%- ext || '?' %>
</div>
<div class="ServiceList-itemInfo u-flex u-alignCenter u-justifySpace">
  <div class="ServiceList-itemInfoTitle">
    <h6 class="CDB-Text CDB-Size-large u-bSpace u-ellipsis" ><%- title %></h6>
    <p class="CDB-Text CDB-Size-medium u-altTextColor u-ellipsis"><%- description %></p>
  </div>
  <div class="ServiceList-itemActions">
    <button class="CDB-Button CDB-Button--secondary js-choose">
      <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase"><%- _t('components.modals.add-layer.imports.service-import.choose') %></span>
    </button>
  </div>
</div>
