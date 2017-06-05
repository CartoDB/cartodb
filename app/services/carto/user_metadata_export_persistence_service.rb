require 'uuidtools'
require_dependency 'carto/uuidhelper'
require_dependency 'carto/query_rewriter'

module Carto
  # Export/import is versioned, but importing should generate a model tree that can be persisted by this class
  class UserMetadataExportPersistenceService
    def save_import(user)
      visualizations = user.visualizations.dup
      user.visualizations = []

      user.save!
      ::User.find(id: user.id).after_save

      vis_persister = VisualizationsExportPersistenceService.new
      visualizations.each do |vis|
        vis_persister.save_import(user, vis)
      end

      user
    end
  end
end
