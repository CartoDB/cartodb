<div class="u-flex u-justifyCenter">
  <div class="Modal-inner Modal-inner--grid u-flex u-justifyCenter">
    <div class="Modal-icon">
      <svg width="25px" height="25px" viewBox="-1 4 25 25" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g id="Outline_Icons" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(-1.000000, 4.000000)">
          <path d="M1.9477838,21.5 C1.6977511,21.5 1.5,21.3016354 1.5,21.0431048 L1.5,1.95689523 C1.5,1.70555616 1.70315066,1.5 1.94113901,1.5 L16.058861,1.5 C16.2975949,1.5 16.5,1.70783627 16.5,1.96250326 L16.5,13.2661378 L17.5,13.2661378 L17.5,1.96250326 C17.5,1.16139088 16.8558926,0.5 16.058861,0.5 L1.94113901,0.5 C1.14821378,0.5 0.5,1.15588925 0.5,1.95689523 L0.5,21.0431048 C0.5,21.8532278 1.1447717,22.5 1.9477838,22.5 L10.0155676,22.5 L10.0155676,21.5 L1.9477838,21.5 Z" id="path-1" fill="#F19243"></path>
          <rect id="Rectangle-2" fill="#F19243" x="1" y="5" width="16" height="1"></rect>
          <path d="M23.854,14.646 L21.354,12.146 C21.166,11.958 20.834,11.958 20.647,12.146 L13.146,19.648 C13.089,19.705 13.054,19.773 13.03,19.845 C13.028,19.852 13.021,19.857 13.019,19.865 L12.019,23.365 C11.969,23.539 12.018,23.727 12.146,23.856 C12.241,23.951 12.369,24.002 12.5,24.002 C12.546,24.002 12.592,23.996 12.637,23.983 L16.137,22.983 C16.144,22.981 16.149,22.974 16.157,22.972 C16.229,22.948 16.297,22.913 16.354,22.856 L23.855,15.354 C24.05,15.158 24.05,14.842 23.854,14.646 L23.854,14.646 L23.854,14.646 Z M16,21.795 L14.207,20.002 L19.001,15.207 L20.794,17 L16,21.795 L16,21.795 L16,21.795 Z M13.747,20.957 L15.045,22.255 L13.228,22.775 L13.747,20.957 L13.747,20.957 L13.747,20.957 Z M21.501,16.293 L19.708,14.5 L21.001,13.207 L22.794,15 L21.501,16.293 L21.501,16.293 L21.501,16.293 Z" id="Shape" fill="#F19243"></path>
        </g>
      </svg>
    </div>
    <div>
      <h2 class=" CDB-Text CDB-Size-huge is-light u-bSpace--xl">
        <%- _t('components.table.columns.change-type.title', { columnName: columnName, newType: newType }) %>
      </h2>
      <p class="CDB-Text CDB-Size-large u-altTextColor">
        <%- _t('components.table.columns.change-type.desc') %>
      </p>
      <ul class="Modal-listActions u-flex u-alignCenter">
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--secondary CDB-Button--big js-cancel">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
              <%- _t('components.table.columns.change-type.cancel') %>
            </span>
          </button>
        </li>
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--primary CDB-Button--big js-confirm">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
              <%- _t('components.table.columns.change-type.confirm') %>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</div>
