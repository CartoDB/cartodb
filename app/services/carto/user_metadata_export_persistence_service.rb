require 'uuidtools'
require_dependency 'carto/uuidhelper'
require_dependency 'carto/query_rewriter'

module Carto
  # Export/import is versioned, but importing should generate a model tree that can be persisted by this class
  class UserMetadataExportPersistenceService
    def save_import(user)
      user = ActiveRecord::Base.transaction do
        visualizations = user.visualizations
        user.visualizations = []

        user.save!

        vis_persister = VisualizationsExportPersistenceService.new
        visualizations.each do |vis|
          vis_persister.save_import(user, vis)
        end

        user
      end
      ::User.find(id: user.id).after_save

      user
    end
  end
end
