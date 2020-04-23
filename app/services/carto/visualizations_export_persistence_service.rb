require_dependency 'carto/uuidhelper'
require_dependency 'carto/query_rewriter'

module Carto
  # Export/import is versioned, but importing should generate a model tree that can be persisted by this class
  class VisualizationsExportPersistenceService
    include Carto::UUIDHelper
    include Carto::QueryRewriter

    # `full_restore = true` means keeping the visualization id and permission. Its intended use is to restore an exact
    # copy of a visualization (e.g: user migration). When it's `false` it will skip restoring ids and permissions. This
    # is the default, and how it's used by the Import API to allow to import a visualization into a different user
    def save_import(user, visualization, renamed_tables: {}, full_restore: false)
      old_username = visualization.user.username if visualization.user
      apply_user_limits(user, visualization)
      ActiveRecord::Base.transaction do
        visualization.id = random_uuid unless visualization.id && full_restore
        visualization.user = user

        ensure_unique_name(user, visualization)

        visualization.layers.each { |layer| layer.fix_layer_user_information(old_username, user, renamed_tables) }
        visualization.analyses.each do |analysis|
          analysis.analysis_node.fix_analysis_node_queries(old_username, user, renamed_tables)
        end

        saved_acl = visualization.permission.access_control_list if full_restore
        visualization.permission = Carto::Permission.new(owner: user, owner_username: user.username)

        map = visualization.map
        map.user = user if map

        visualization.analyses.each do |analysis|
          analysis.user_id = user.id
        end

        sync = visualization.synchronization
        if sync
          sync.id = random_uuid unless sync.id && full_restore
          sync.user = user
          sync.log.user_id = user.id if sync.log
        end

        user_table = visualization.map.user_table if map
        if user_table
          user_table.user = user
          user_table.service.register_table_only = true
          raise 'Cannot import a dataset without physical table' unless user_table.service.real_table_exists?

          data_import = user_table.data_import
          if data_import
            existing_data_import = Carto::DataImport.where(id: data_import.id).first
            user_table.data_import = existing_data_import if existing_data_import
            data_import.synchronization_id = sync.id if sync
            data_import.user_id = user.id
          end
        end

        unless full_restore
          visualization.mapcaps.clear
          visualization.created_at = DateTime.now
          visualization.updated_at = DateTime.now
          visualization.locked = false
        end

        unless visualization.save
          error_message = "Errors saving imported visualization: #{visualization.errors.full_messages}"
          raise Carto::UnauthorizedError.new(error_message) if visualization.errors.include?(:privacy)
          raise error_message
        end

        # Save permissions after visualization, in order to be able to regenerate shared_entities
        if saved_acl
          visualization.permission.access_control_list = saved_acl
          visualization.permission.save!
        end

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

        if map
          map.data_layers.each(&:register_table_dependencies)

          new_user_layers = map.base_layers.select(&:custom?).select { |l| !contains_equivalent_base_layer?(user.layers, l) }
          new_user_layers.map(&:dup).map { |l| user.layers << l }
          data_import = map.user_table.try(:data_import)
          if data_import
            data_import.table_id = map.user_table.id
            data_import.save!
            data_import.external_data_imports.each do |edi|
              edi.synchronization_id = sync.id if sync
              edi.save!
            end
          end
        end
      end

      visualization.save!
      visualization
    end

    private

    def contains_equivalent_base_layer?(layers, layer)
      layers.any? { |l| equivalent_base_layer?(l, layer) }
    end

    def equivalent_base_layer?(layer_a, layer_b)
      layer_a.kind == 'tiled' && layer_a.kind == layer_b.kind && layer_a.options == layer_b.options
    end

    def ensure_unique_name(user, visualization)
      existing_names = Carto::Visualization.uniq
                                           .where(user_id: user.id)
                                           .where("name ~ ?", "#{Regexp.escape(visualization.name)}( Import)?( \d*)?$")
                                           .where(type: visualization.type)
                                           .pluck(:name)
      if existing_names.include?(visualization.name)
        raise 'Cannot rename a dataset during import' if visualization.canonical?
        import_name = "#{visualization.name} Import"
        i = 1
        while existing_names.include?(import_name)
          import_name = "#{visualization.name} Import #{i += 1}"
        end
        visualization.name = import_name
      end
    end

    def apply_user_limits(user, visualization)
      can_be_private = visualization.derived? ? user.private_maps_enabled : user.private_tables_enabled
      unless can_be_private
        visualization.privacy = Carto::Visualization::PRIVACY_PUBLIC
        visualization.user_table.privacy = Carto::UserTable::PRIVACY_PUBLIC if visualization.canonical?
      end
      # If password is not exported we must fallback to private
      if visualization.password_protected? && !visualization.has_password?
        visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
      end

      layers = []
      data_layer_count = 0

      if visualization.map
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
        visualization.map.layers.clear
        visualization.map.layers_maps.clear
        layers.each { |l| visualization.map.layers << l }
      end
    end
  end
end
