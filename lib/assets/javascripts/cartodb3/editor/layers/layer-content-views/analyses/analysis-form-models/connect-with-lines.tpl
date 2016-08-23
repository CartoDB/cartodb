<form>
  <div class="Editor-HeaderInfo">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">3</div>
    <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="<%= parametersDataFields %>">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('analyses.connect-with-lines.title') %></h2>
      </div>
      <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--xl"><%- _t('editor.layers.analysis-form.define-reference-and-target') %></p>
    </div>
  </div>

  <% if (type == 'line-source-to-target') { %>
  <div class="Editor-HeaderInfo">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">3</div>
    <div class="Editor-HeaderInfo-inner CDB-Text">

      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('editor.layers.analysis-form.measure-by') %></h2>
      </div>
      <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--xl"><%- _t('editor.layers.analysis-form.filter-aggregate') %></p>

      <div class="Editor-checker u-flex u-alignCenter" data-fields="order"></div>

      <% if (order) { %>
      <div class="Editor-formInner--nested">
        <div class="CDB-Text Editor-formInner">
          <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- _t('editor.layers.analysis-form.source-col') %></p>
          <div class="Editor-formInput" data-editors="source_column"></div>
        </div>

        <div class="CDB-Text Editor-formInner">
          <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- _t('editor.layers.analysis-form.target-col') %></p>
          <div class="Editor-formInput" data-editors="target_column"></div>
        </div>
      </div>
      <% } %>
    </div>
  </div>
  <% } %>
</form>
