# encoding: utf-8
require_relative '../../../lib/varnish/lib/cartodb-varnish'
require_relative '../user'
require_relative 'user_table'

module CartoDB
  class TablePrivacyManager

    def initialize(table)
      @table = table
    end

    def apply_privacy_change(metadata_table, old_privacy, privacy_changed = false)
      if @table.table_visualization
        affected_entities = [@table.table_visualization] + metadata_table.affected_visualizations

        @table.map.save

        # Separate on purpose as if fails here no need to revert visualizations' privacy
        revertable_privacy_change(metadata_table, old_privacy) do
          # Map saving actually doesn't changes privacy, but to keep on same reverting logic
          @table.map.save
          set_from_table_privacy(@table.privacy)
        end

        revertable_privacy_change(metadata_table, old_privacy, affected_entities) do
          propagate_to([@table.table_visualization])
          notify_privacy_affected_entities(metadata_table) if privacy_changed
        end
      end
    rescue NoMethodError => exception
      CartoDB::Logger.debug(
        exception: exception,
        message: "#{exception.message} #{exception.backtrace}",
        user: Carto::User.find(@table.user_id),
        table_id: @table.id,
        table_name: @table.name,
        data_import_id: @table.data_import_id
      )

      raise exception
    end

    def set_from_visualization(visualization)
      set_public                if visualization.public?
      set_public_with_link_only if visualization.public_with_link?
      set_private               if visualization.private? || visualization.organization?
      table.update(privacy: privacy)
      self
    end

    def update_cdb_tablemetadata
      table.update_cdb_tablemetadata
    end

    private

    attr_reader :table
    attr_accessor :privacy

    def set_from_table_privacy(table_privacy)
      case table_privacy
      when Carto::UserTable::PRIVACY_PUBLIC
        set_public
      when Carto::UserTable::PRIVACY_LINK
        set_public_with_link_only
      else
        set_private
      end
    end

    # Propagation flow: Table -> Table PrivacyManager -> Visualization -> Visualization NamedMap
    def propagate_to(visualizations, table_privacy_changed = false)
      visualizations.each do |visualization|
        if visualization.type == CartoDB::Visualization::Member::TYPE_CANONICAL
          # Each table has a canonical visualization which must have privacy synced
          visualization.privacy = Carto::UserTable::PRIVACY_VALUES_TO_TEXTS[privacy]
          visualization.store_using_table(table_privacy_changed)
        else
          visualization.invalidate_cache
        end
      end

      self
    end

    def set_public
      self.privacy = Carto::UserTable::PRIVACY_PUBLIC
      Carto::TableAndFriends.apply(owner.in_database, owner.database_schema, table.name) do |schema, table_name|
        set_database_permissions(grant_query(schema, table_name))
      end
      self
    end

    def set_private
      self.privacy = Carto::UserTable::PRIVACY_PRIVATE
      Carto::TableAndFriends.apply(owner.in_database, owner.database_schema, table.name) do |schema, table_name|
        set_database_permissions(revoke_query(schema, table_name))
      end
      self
    end

    def set_public_with_link_only
      self.privacy = Carto::UserTable::PRIVACY_LINK
      Carto::TableAndFriends.apply(owner.in_database, owner.database_schema, table.name) do |schema, table_name|
        set_database_permissions(grant_query(schema, table_name))
      end
      self
    end

    def owner
      @owner ||= ::User.where(id: table.user_id).first
    end

    def set_database_permissions(query)
      owner.in_database(as: :superuser).run(query)
    end

    def revoke_query(schema, table_name)
      %{
        REVOKE SELECT ON #{fully_qualified_table_name(schema, table_name)}
        FROM #{CartoDB::PUBLIC_DB_USER}
      }
    end

    def grant_query(schema, table_name)
      %{
        GRANT SELECT ON #{fully_qualified_table_name(schema, table_name)}
        TO #{CartoDB::PUBLIC_DB_USER};
      }
    end

    def revertable_privacy_change(metadata_table, old_privacy = nil, entities = [])
      yield
    rescue => exception
      CartoDB.notify_exception(exception, user_id: metadata_table.user_id, table_id: metadata_table.id)
      revert_to_previous_privacy(metadata_table, old_privacy, entities)
      raise exception
    end

    def revert_to_previous_privacy(metadata_table, old_privacy, additional_revert_targets = [])
      return unless old_privacy

      set_from_table_privacy(old_privacy)

      errors = []
      additional_revert_targets.each do |visualization|
        begin
          propagate_to([visualization])
        rescue => exception
          # Can't do much more, just let remaining ones finish
          errors << exception
        end
      end

      if !errors.empty?
        CartoDB.notify_error("Errors reverting Table privacy", user_id: metadata_table.user_id,
                                                               table_id: metadata_table.id,
                                                               errors: errors)
      end
    end

    def notify_privacy_affected_entities(metadata_table)
      propagate_to(metadata_table.affected_visualizations, true)
      update_cdb_tablemetadata
    end

    def fully_qualified_table_name(schema, table_name)
      %{"#{schema}"."#{table_name}"}
    end
  end
end
