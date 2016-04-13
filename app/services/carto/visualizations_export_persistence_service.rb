require 'uuidtools'
require_dependency 'carto/uuidhelper'

module Carto
  # Export/import is versioned, but importing should generate a model tree that can be persisted by this class
  class VisualizationsExportPersistenceService
    include Carto::UUIDHelper

    def save_import(user, visualization)
      ActiveRecord::Base.transaction do
        visualization.id = random_uuid
        visualization.user = user

        visualization.layers.map do |layer|
          options = layer.options
          if options.has_key?(:user_name)
            options[:user_name] = user.username
          end
        end

        permission = Carto::Permission.new(owner: user, owner_username: user.username)
        visualization.permission = permission

        map = visualization.map
        map.user = user
        unless map.save
          raise "Errors saving imported map: #{map.errors.full_messages}"
        end

        visualization.analyses.each do |analysis|
          analysis.user_id = user.id
        end

        # INFO: workaround for array saves not working
        tags = visualization.tags
        visualization.tags = nil
        unless visualization.save
          raise "Errors saving imported visualization: #{visualization.errors.full_messages}"
        end

        visualization.update_attribute(:tags, tags)

        visualization.layers.map do |layer|
          # Flag needed because `.changed?` won't realize about options hash changes
          changed = false
          if layer.options.has_key?(:id)
            layer.options[:id] = layer.id
            changed = true
          end
          if layer.options.has_key?(:stat_tag)
            layer.options[:stat_tag] = visualization.id
            changed = true
          end
          layer.save if changed
        end
      end

      # Propagate changes (named maps, default permissions and so on)
      visualization_member = CartoDB::Visualization::Member.new(id: visualization.id).fetch
      visualization_member.store

      visualization
    end
  end
end
