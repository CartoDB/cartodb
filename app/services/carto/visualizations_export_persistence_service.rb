require 'uuidtools'
require_dependency 'carto/uuidhelper'
require_dependency 'carto/query_rewriter'

module Carto
  # Export/import is versioned, but importing should generate a model tree that can be persisted by this class
  class VisualizationsExportPersistenceService
    include Carto::UUIDHelper
    include Carto::QueryRewriter

    def save_import(user, visualization, renamed_tables: {})
      old_username = visualization.user.username if visualization.user
      apply_user_limits(user, visualization)
      ActiveRecord::Base.transaction do
        visualization.id = random_uuid
        visualization.user = user

        ensure_unique_name(user, visualization)

        visualization.layers.each { |layer| layer.fix_layer_user_information(old_username, user, renamed_tables) }
        visualization.analyses.each do |analysis|
          analysis.analysis_node.fix_analysis_node_queries(old_username, user, renamed_tables)
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

        map.data_layers.each(&:register_table_dependencies)
      end

      # Propagate changes (named maps, default permissions and so on)
      visualization_member = CartoDB::Visualization::Member.new(id: visualization.id).fetch
      visualization_member.store

      visualization
    end

    private

    def ensure_unique_name(user, visualization)
      existing_names = Carto::Visualization.uniq
                                           .where(user_id: user.id)
                                           .where("name ~ ?", "#{visualization.name}( Import)?( \d*)?$")
                                           .pluck(:name)
      if existing_names.include?(visualization.name)
        import_name = "#{visualization.name} Import"
        i = 1
        while existing_names.include?(import_name)
          import_name = "#{visualization.name} Import #{i += 1}"
        end
        visualization.name = import_name
      end
    end

    def apply_user_limits(user, visualization)
      visualization.privacy = Carto::Visualization::PRIVACY_PUBLIC unless user.private_maps_enabled
      # Since password is not exported we must fallback to private
      if visualization.privacy == Carto::Visualization::PRIVACY_PROTECTED
        visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
      end

      layers = []
      data_layer_count = 0
      visualization.map.layers.each do |layer|
        if layer.data_layer?
          if data_layer_count < user.max_layers
            layers.push(layer)
            data_layer_count += 1
          end
        else
          layers.push(layer)
        end
      end
      visualization.map.layers = layers
    end
  end
end
