<form>
  <div class="Editor-HeaderInfo Editor-HeaderInfo--noMargin">
    <div class="Editor-HeaderNumeration CDB-Text is-semibold u-rSpace--m">3</div>
    <div class="Editor-HeaderInfo-inner CDB-Text" data-fields="<%= parametersDataFields %>">
      <div class="Editor-HeaderInfo-title u-bSpace--m">
        <h2 class="CDB-Text CDB-HeaderInfo-titleText CDB-Size-large"><%- _t('analyses.connect-with-lines.title') %></h2>
      </div>
      <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--xl"><%- _t('editor.layers.analysis-form.define-reference-and-target') %></p>
    </div>
  </div>

  <% if (type == 'line-sequential') { %>
    <div class="Editor-HeaderInfo">
      <div class="Editor-HeaderPad u-rSpace--m"></div>

      <div class="Editor-HeaderInfo-inner CDB-Text">
        <div class="Editor-checker Editor-checker--slim u-flex u-alignCenter" data-fields="order"></div>

        <% if (order) { %>
          <div class="Editor-formInner--nested">
            <div class="CDB-Text Editor-formInner Editor-formInner--noMargin">
              <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- _t('editor.layers.analysis-form.order-by') %></p>
              <div class="Editor-formInput" data-editors="order_column"></div>
            </div>

            <div class="CDB-Text Editor-formInner">
              <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- _t('editor.layers.analysis-form.direction') %></p>
              <div class="Editor-formInput" data-editors="order_type"></div>
            </div>
          </div>
        <% } %>
        <div class="Editor-checker" data-fields="category_column"></div> 
      </div>
    </div>
  <% } %>

  <% if (type == 'line-source-to-target') { %>
    <div class="Editor-HeaderInfo">
      <div class="Editor-HeaderPad u-rSpace--m"></div>
      <div class="Editor-HeaderInfo-inner CDB-Text">

        <div class="Editor-checker Editor-checker--slim u-flex u-alignCenter" data-fields="group"></div>

        <% if (group) { %>
          <div class="Editor-formInner--nested">
            <div class="CDB-Text Editor-formInner Editor-formInner--noMargin">
              <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- _t('editor.layers.analysis-form.source-col') %></p>
              <div class="Editor-formInput" data-editors="source_column"></div>
            </div>

            <div class="CDB-Text Editor-formInner">
              <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- _t('editor.layers.analysis-form.target-col') %></p>
              <div class="Editor-formInput" data-editors="target_source_column"></div>
            </div>
          </div>
        <% } %>
      </div>
    </div>
  <% } %>
</form>
