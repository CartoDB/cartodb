require 'uuidtools'
require_dependency 'carto/uuidhelper'

module Carto
  # Export/import is versioned, but importing should generate a model tree that can be persisted by this class
  class VisualizationsExportPersistenceService
    include Carto::UUIDHelper

    def save_import(user, visualization)
      apply_user_limits(user, visualization)
      ActiveRecord::Base.transaction do
        visualization.id = random_uuid
        visualization.user = user

        visualization.layers.map { |layer| fix_layer_user_information(layer, user) }

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

      visualization_member.map.layers.map(&:register_table_dependencies)

      visualization
    end

    private

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

    def fix_layer_user_information(layer, new_user)
      new_username = new_user.username

      options = layer.options
      if options.has_key?(:user_name)
        old_username = options[:user_name]
        options[:user_name] = new_username

        # query_history is not modified as a safety measure for cases where this naive replacement doesn't work
        query = options[:query]

        options[:query] = rewrite_query_for_new_user(query, old_username, new_user) if query.present?
      end
    end

    def rewrite_query_for_new_user(query, old_username, new_user)
      if new_user.username == new_user.database_schema
        new_schema = new_user.sql_safe_database_schema
        query.gsub(" #{old_username}.", " #{new_schema}.").gsub(" \"#{old_username}\".", " #{new_schema}.")
      else
        query.gsub(" #{old_username}.", " ").gsub(" \"#{old_username}\".", " ")
      end
    end
  end
end
