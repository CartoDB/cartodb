require 'uuidtools'

module Carto
  # Export/import is versioned, but importing should generate a model tree that can be persisted by this class
  class VisualizationsExportPersistenceService
    def save_import(user, visualization)
      ActiveRecord::Base.transaction do
        visualization.id = UUIDTools::UUID.timestamp_create.to_s
        visualization.user = user

        map = visualization.map
        map.user = user
        map.save

        visualization.analyses.each do |analysis|
          analysis.user_id = user.id
        end

        # INFO: workaround for array saves not working
        tags = visualization.tags
        visualization.tags = nil
        visualization.save

        visualization.update_attribute(:tags, tags)
      end

      visualization
    end
  end
end
