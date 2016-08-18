require 'uuidtools'
require_dependency 'carto/uuidhelper'

module Carto
  # Export/import is versioned, but importing should generate a model tree that can be persisted by this class
  class VisualizationsExportPersistenceService
    include Carto::UUIDHelper

    def save_import(user, visualization, renamed_tables: {})
      old_username = visualization.user.username if visualization.user
      apply_user_limits(user, visualization)
      ActiveRecord::Base.transaction do
        visualization.id = random_uuid
        visualization.user = user

        ensure_unique_name(user, visualization)

        visualization.layers.each { |layer| fix_layer_user_information(layer, old_username, user, renamed_tables) }
        visualization.analyses.each do |analysis|
          fix_analysis_node_queries(analysis.analysis_node, old_username, user, renamed_tables)
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

      visualization.save

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

    def fix_layer_user_information(layer, old_username, new_user, renamed_tables)
      new_username = new_user.username

      options = layer.options
      if options.has_key?(:user_name)
        old_username ||= options[:user_name]
        options[:user_name] = new_username
      end

      if options.has_key?(:table_name)
        old_table_name = options[:table_name]
        options[:table_name] = renamed_tables.fetch(old_table_name, old_table_name)
      end

      # query_history is not modified as a safety measure for cases where this naive replacement doesn't work
      query = options[:query]
      options[:query] = rewrite_query(query, old_username, new_user, renamed_tables) if query.present?
    end

    def fix_analysis_node_queries(node, old_username, new_user, renamed_tables)
      options = node.options

      if options && options.has_key?(:table_name)
        old_table_name = options[:table_name]
        options[:table_name] = renamed_tables.fetch(old_table_name, old_table_name)
      end

      params = node.params
      if params && old_username
        query = params[:query]
        params[:query] = rewrite_query(query, old_username, new_user, renamed_tables) if query.present?
      end

      node.children.each { |child| fix_analysis_node_queries(child, old_username, new_user, renamed_tables) }
    end

    def rewrite_query(query, old_username, new_user, renamed_tables)
      new_query = rewrite_query_for_new_user(query, old_username, new_user)
      new_query = rewrite_query_for_renamed_tables(new_query, renamed_tables) if renamed_tables.present?
      if test_query(new_user, new_query)
        new_query
      else
        CartoDB::Logger.debug(message: 'Did not rewrite query on import', old_query: query, new_query: new_query,
                              old_username: @old_username, user: new_user, renamed_tables: renamed_tables)
        query
      end
    end

    def test_query(user, query)
      user.in_database.execute("EXPLAIN (#{query})")
      true
    rescue
      false
    end

    def rewrite_query_for_new_user(query, old_username, new_user)
      if new_user.username == new_user.database_schema
        new_schema = new_user.sql_safe_database_schema
        query.gsub(" #{old_username}.", " #{new_schema}.").gsub(" \"#{old_username}\".", " #{new_schema}.")
      else
        query.gsub(" #{old_username}.", " ").gsub(" \"#{old_username}\".", " ")
      end
    end

    PSQL_WORD_CHARS = '[$_[[:alnum:]]]'.freeze
    def rewrite_query_for_renamed_tables(query, renamed_tables)
      renamed_tables.reduce(query) do |sql, (old_name, new_name)|
        # Replaces the table name only if it matches the whole word
        # i.e: previous and next characters are not PSQL_WORD_CHARS (alphanumerics, _ or $)
        sql.gsub(/(?<!#{PSQL_WORD_CHARS})#{Regexp.escape(old_name)}(?!#{PSQL_WORD_CHARS})/, new_name)
      end
    end
  end
end
