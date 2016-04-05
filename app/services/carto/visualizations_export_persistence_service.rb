require 'uuidtools'

module Carto
  # Export/import is versioned, but importing should generate a model tree that can be persisted by this class
  class VisualizationsExportPersistenceService
    def save_import(user, visualization)
      visualization.id = UUIDTools::UUID.timestamp_create.to_s
      visualization.user = user

      map = visualization.map
      map.user = user
      map.save

      # INFO: workaround for array saves not working
      tags = visualization.tags
      visualization.tags = nil
      visualization.save

      visualization.update_attribute(:tags, tags)

      visualization
    end
  end
end
