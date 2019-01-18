<div class="u-flex u-justifyCenter">
  <div class="Modal-inner Modal-inner--grid u-flex u-justifyCenter">
    <div class="Modal-icon">
      <svg width="16px" height="24px" viewBox="0 5 16 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g id="lock-open" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(0.000000, 5.000000)">
          <path d="M14,10.727 L14,5.5 C14,2.467 11.532,0 8.5,0 C5.468,0 3,2.467 3,5.5 L4,5.5 C4,3.019 6.019,1 8.5,1 C10.981,1 13,3.019 13,5.5 L13,9.765 C11.629,8.663 9.892,8 8,8 C3.589,8 0,11.589 0,16 C0,20.411 3.589,24 8,24 C12.411,24 16,20.411 16,16 C16,13.979 15.24,12.136 14,10.727 L14,10.727 Z M8,23 C4.141,23 1,19.86 1,16 C1,12.14 4.141,9 8,9 C11.859,9 15,12.14 15,16 C15,19.86 11.859,23 8,23 L8,23 Z" id="Shape" fill="#000000 "></path>
          <path d="M8,15 C7.448,15 7,15.449 7,16 C7,16.365 7.207,16.672 7.5,16.847 L7.5,19.5 C7.5,19.776 7.724,20 8,20 C8.276,20 8.5,19.776 8.5,19.5 L8.5,16.847 C8.793,16.672 9,16.365 9,16 C9,15.449 8.552,15 8,15 L8,15 Z" id="Shape" fill="#000000 "></path>
        </g>
      </svg>
    </div>
    <div>
      <h2 class=" CDB-Text CDB-Size-huge is-light u-bSpace--xl"><%- _t('dataset.unlock.title', { tableName: tableName }) %></h2>
      <p class="CDB-Text CDB-Size-large u-altTextColor"><%- _t('dataset.unlock.desc') %></p>
      <ul class="Modal-listActions u-flex u-alignCenter">
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--secondary CDB-Button--big js-cancel">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
              <%- _t('dataset.unlock.cancel') %>
            </span>
          </button>
        </li>
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--primary CDB-Button--big js-confirm">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
              <%- _t('dataset.unlock.confirm') %>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</div>
