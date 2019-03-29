<form>
  <div class="Editor-HeaderInfo">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">1</div>
    <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="left_source,right_source,join_operator">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('editor.layers.analysis-form.merge-step-one-title') %></h2>
      </div>
      <div class="Editor-HeaderInfo-subtitle u-bSpace--m">
        <p class="CDB-Text CDB-FontSize-small u-upperCase u-altTextColor"><%- _t('editor.layers.analysis-form.target-layer-dataset') %></p>
      </div>
    </div>
  </div>
    <div class="Editor-HeaderInfo <%- right_source ? '' : 'is-disabled' %>">
      <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">2</div>
      <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="left_source_column,right_source_column">
        <div class="Editor-HeaderInfo-title u-bSpace--m">
          <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('editor.layers.analysis-form.key-columns') %></h2>
        </div>
        <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--xl"><%- _t('editor.layers.analysis-form.key-columns-desc') %></p>
      </div>
    </div>
    <div class="Editor-HeaderInfo <%- hasLeftAndRightSourceColumns ? '' : 'is-disabled' %>">
      <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">3</div>
      <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="source_geometry_selector,left_source_columns,right_source_columns">
        <div class="Editor-HeaderInfo-title u-bSpace--m">
          <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('editor.layers.analysis-form.output-data') %></h2>
        </div>
        <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--xl"><%- _t('editor.layers.analysis-form.keep-data') %></p>
      </div>
    </div>
</form>
