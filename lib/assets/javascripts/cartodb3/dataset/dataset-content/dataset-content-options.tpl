<div class="js-sync"></div>
<div class="js-dataset">
  <ul class="u-flex u-justifySpace">
    <% if (isEditable) { %>
      <li>
        <button class="CDB-Text CDB-Size-small is-semibold u-actionTextColor u-rSpace--xl u-upperCase js-addRow">
          <%- _t('dataset.options.add-row') %>
        </button>
      </li>
      <li>
        <button class="CDB-Text CDB-Size-small is-semibold u-actionTextColor u-rSpace--xl u-upperCase js-addColumn">
          <%- _t('dataset.options.add-column') %>
        </button>
      </li>
    <% } %>
    <li>
      <button class="CDB-Text CDB-Size-small is-semibold u-actionTextColor u-upperCase is-disabled js-export">
        <%- _t('dataset.options.export') %>
      </button>
    </li>
  </ul>
</div>
