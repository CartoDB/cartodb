<% var NodeIds = require('../../../../value-objects/analysis-node-ids'); %>

<p class="CDB-Text Onboarding-description">
  <%- _t('analyses-onboarding.filter-by-node-column.description', {
    name_of_source_layer: NodeIds.letter(source.get('id')).toUpperCase(),
    name_of_filter_source_layer: NodeIds.letter(filter_source.get('id')).toUpperCase()
  }) %>
</p>
