<form>
  <div class="Editor-HeaderInfo">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">2</div>
    <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="left_source,right_source,join_operator">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('analyses.merge.title') %></h2>
      </div>
      <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--m"><%- _t('editor.layers.analysis-form.define-two-layers') %></p>
    </div>
  </div>
  <% if (right_source) { %>
  <div class="Editor-HeaderInfo">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">3</div>
    <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="left_source_column,right_source_column">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('editor.layers.analysis-form.foreign-keys') %></h2>
      </div>
      <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--xl"><%- _t('editor.layers.analysis-form.no-coincidence') %></p>
    </div>
  </div>
  <% if (hasLeftAndRightSourceColumns) { %>
  <div class="Editor-HeaderInfo">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">4</div>
    <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="source_geometry_selector,left_source_columns,right_source_columns">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('editor.layers.analysis-form.columns') %></h2>
      </div>
      <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--xl"><%- _t('editor.layers.analysis-form.keep-columns') %></p>
    </div>
  </div>
  <% } %>
  <% } %>
</form>
