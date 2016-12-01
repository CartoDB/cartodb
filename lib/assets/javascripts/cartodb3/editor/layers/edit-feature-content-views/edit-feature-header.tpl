<div class="Editor-HeaderInfoEditor">
  <div class="u-rSpace--xl u-actionTextColor js-back Editor-HeaderInfoEditorShape">
    <button>
      <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
    </button>
  </div>

  <div class="Editor-HeaderInfo-inner u-ellipsis">
    <div class="Editor-HeaderInfo-title u-bSpace">
      <h2 class="Inline-editor">
        <div class="CDB-Text CDB-Size-huge is-light u-ellipsis"><%- _t('editor.edit-feature.edit', { featureType: featureType }) %></div>
      </h2>
    </div>
    <div class="u-flex u-ellipsis">
      <p class="Editor-headerLayerName CDB-Text CDB-Size-medium u-ellipsis">
        <a href="<%- url %>" target="_blank" title="<%- tableName %>" class="Editor-headerLayerName"><%- tableName %></a>
      </p>
    </div>
  </div>
  <div class="u-flex u-tSpace-xl js-context-menu"></div>
</div>
