<div class="u-flex u-justifyCenter">
  <div class="Modal-inner u-flex u-justifyCenter">
    <div class="Modal-icon">
      <svg width="24px" height="25px" viewbox="521 436 24 25" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
            <path d="M524.5,440 L540.5,440 L540.5,460 L524.5,460 L524.5,440 Z M528.5,437 L536.5,437 L536.5,440 L528.5,440 L528.5,437 Z M522,440 L544,440 L522,440 Z M528.5,443.5 L528.5,455.5 L528.5,443.5 Z M532.5,443.5 L532.5,455.5 L532.5,443.5 Z M536.5,443.5 L536.5,455.5 L536.5,443.5 Z" id="Shape" stroke="#F19243" stroke-width="1" fill="none"/>
      </svg>
    </div>
    <div>
      <h2 class=" CDB-Text CDB-Size-huge is-light u-bSpace--m u-alertTextColor"><%- _t('editor.layers.delete.title', { layerName: layerName }) %></h2>
      <p class="CDB-Text CDB-Size-medium u-altTextColor"><%= _t('editor.layers.delete.desc', { layerVisName: layerVisName }) %></p>
      <ul class="Modal-listText">
        <% if (dependentNodes.length > 0) { %>
          <li class="Modal-listTextItem">
            <p class="CDB-Text CDB-Size-medium">Deleting this layer will affect to
              <% for (var i = 0; i < dependentNodes.length; i++) { %>
                  <span class="CDB-Text is-semibold"><%- dependentNodes[i] %></span>
                  <% if (i < (dependentNodes.length - 2)) { %>
                    ,
                  <% } else if (i == (dependentNodes.length - 2)) { %>
                    and
                  <% } %>
              <% } %>
            </p>
          </li>
        <% } %>
        <li class="Modal-listTextItem">
          <p class="CDB-Text CDB-Size-medium">Before deleting your map, you can <a href="#" data-event="exportMapAction">export as .CARTO file</a></p>
        </li>
      </ul>
      <ul class="Modal-listActions u-flex u-alignCenter">
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--secondary CDB-Button--big js-cancel">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
              <%- _t('editor.layers.delete.cancel') %>
            </span>
          </button>
        </li>
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--primary CDB-Button--big js-confirm">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
              <%- _t('editor.layers.delete.confirm') %>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</div>
