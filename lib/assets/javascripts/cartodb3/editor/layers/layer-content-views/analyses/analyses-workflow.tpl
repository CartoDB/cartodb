<div class="Editor-HeaderInfo">
  <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">1</div>
  <div class="Editor-HeaderInfo-inner CDB-Text js-content">
    <div class="Editor-HeaderInfo-title u-bSpace--m">
      <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large">
        <%- _t('editor.layers.analysis-form.workflow') %>
        <span class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large u-altTextColor">(<%- layerAnalysisCount %>)</span>
      </h2>
    </div>
    <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--xl">
      <%- _t('editor.layers.layer.analysis') %> <%- selectedNodeId %>
      <% if (canDelete) { %>
        <button class="js-delete u-actionTextColor u-upperCase"><%- deleteLabel %></button>
      <% } %>
    </p>
  </div>
</div>
