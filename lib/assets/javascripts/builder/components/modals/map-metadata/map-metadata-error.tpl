<div class="IntermediateInfo">
  <div class="Dialog-header Modal-header js-header">
    <div class="Dialog-headerIcon Dialog-headerIcon--negative">
      <i class="CDB-IconFont CDB-IconFont-cockroach"></i>
    </div>
    <h2 class="CDB-Text CDB-Size-large u-bSpace u-errorTextColor"><%- _t('components.modals.maps-metadata.error.title') %></h2>
    <h3 class="CDB-Text CDB-Size-medium u-secondaryTextColor"><%= error %></h3>
  </div>

  <div class="Modal-body">
    <div class="Modal-body-inner">

      <div class="js-footer">
        <ul class="Modal-actions is-narrow">
          <li class="Modal-actions-button">
            <button class="CDB-Button CDB-Button--primary js-back">
              <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase"><%- _t('components.modals.maps-metadata.back-btn') %></span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</div>