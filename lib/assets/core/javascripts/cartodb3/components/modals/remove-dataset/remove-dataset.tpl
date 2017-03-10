<div class="u-flex u-justifyCenter">
  <div class="Modal-inner u-flex u-justifyCenter">
    <div class="Modal-icon">
      <svg width="24px" height="25px" viewbox="521 436 24 25" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <path d="M524.5,440 L540.5,440 L540.5,460 L524.5,460 L524.5,440 Z M528.5,437 L536.5,437 L536.5,440 L528.5,440 L528.5,437 Z M522,440 L544,440 L522,440 Z M528.5,443.5 L528.5,455.5 L528.5,443.5 Z M532.5,443.5 L532.5,455.5 L532.5,443.5 Z M536.5,443.5 L536.5,455.5 L536.5,443.5 Z" id="Shape" stroke="#F19243" stroke-width="1" fill="none"/>
      </svg>
    </div>
    <div>
      <h2 class="CDB-Text CDB-Size-huge is-light u-bSpace--xl">
        <%= _t('dataset.delete.title', { tableName: tableName }) %>
      </h2>
      <p class="CDB-Text CDB-Size-large u-secondaryTextColor"><%- _t('dataset.delete.desc') %></p>

      <% if (affectedVisCount > 0) { %>
        <div class="Modal-listActions js-affectedVis">
          <p class="CDB-Text CDB-Size-large u-altTextColor">
            <% if (affectedVisCount > maxVisCount) {%>
              <%= _t('dataset.delete.affected-vis-count-extended', {affectedVisCount: affectedVisCount}) %>
            <% } else { %>
              <%= _t('dataset.delete.affected-vis-count', {smart_count: affectedVisCount}) %>
            <% } %>
          </p>

          <ul class="u-flex u-justifyStart u-tSpace-xl">
            <% visibleAffectedVis.forEach(function(vis) { %>
              <li class="MapsList-item MapsList-item--wRightMargins">
                <div class="MapCard" data-vis-id="<%- vis.visId %>" data-vis-owner-name="<%- vis.ownerName %>">
                  <a href="<%- vis.url %>" target="_blank" class="MapCard-header MapCard-header--mCompact js-header">
                    <img class="MapCard-preview" src="<%- vis.previewUrl %>" style="display: inline;">
                    <div class="MapCard-loader"></div>
                  </a>
                  <div class="MapCard-content MapCard-content--compact">
                    <div class="MapCard-contentBody">
                      <div class="MapCard-contentBodyRow MapCard-contentBodyRow--flex">
                        <h3 class="CDB-Text CDB-Size-large u-bSpace u-ellipsis">
                          <a href="<%- vis.url %>" target="_blank" title="<%- vis.name %>" class="u-mainTextColor"><%- vis.name %></a>
                        </h3>
                      </div>
                      <p class="MapCard-contentBodyTimeDiff DefaultTimeDiff CDB-Text CDB-Size-medium u-altTextColor">
                        <%- vis.timeDiff %>
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            <% }); %>
          </ul>
        </div>
      <% } %>

      <% if (affectedEntitiesCount > 0 || organizationAffected) { %>
        <div class="Modal-listActions js-affectedEntities">
          <p class="CDB-Text CDB-Size-large u-altTextColor">
            <% if (organizationAffected) { %>
              <%= _t('dataset.delete.whole-organization-affected') %>
            <% } else if (affectedEntitiesCount > maxEntitiesCount && visibleAffectedEntities.length > 0) {%>
              <%= _t('dataset.delete.affected-entities-count-extended', {affectedEntitiesCount: affectedEntitiesCount}) %>
            <% } else { %>
              <%= _t('dataset.delete.affected-entities-count', {smart_count: affectedEntitiesCount}) %>
            <% } %>
          </p>

          <ul class="u-flex u-justifyStart u-tSpace-xl">
          <% visibleAffectedEntities.forEach(function(entity) { %>
            <% if (entity.avatarUrl) { %> 
              <li class="u-rSpace--m">
                <div class="Share-user Share-user--medium" style="background-image: url(<%- entity.avatarUrl %>)" data-username="<%- entity.username %>" title="<%- entity.username %>"></div>
              </li>
            <% } %>
          <% }); %>
        </ul>
        </div>
      <% } %>

      <ul class="Modal-listActions u-flex u-alignCenter">
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--secondary CDB-Button--medium js-cancel">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">
              <%- _t('dataset.delete.cancel') %>
            </span>
          </button>
        </li>
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--primary CDB-Button--medium js-confirm">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">
              <%- _t('dataset.delete.confirm') %>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</div>
