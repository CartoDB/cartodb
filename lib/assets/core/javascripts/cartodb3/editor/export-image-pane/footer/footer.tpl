<button class="CDB-Button CDB-Button--loading CDB-Button--primary js-ok track-ImageExport track-export
  <% if (isLoading || isDisabled) { %> is-disabled <% } %>
  <% if (isLoading) { %> is-loading <% } %>
  "
  <% if (isDisabled) { %> disabled <% } %>>
  <div class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase u-flex">
    <%- _t('editor.maps.export-image.export') %>
  </div>
  <div class="CDB-Button-loader CDB-LoaderIcon is-white">
    <svg class="CDB-LoaderIcon-spinner" viewbox="0 0 50 50">
      <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"/>
    </svg>
  </div>
</button>
