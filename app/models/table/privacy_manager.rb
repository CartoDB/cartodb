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
      begin
        @table.map.save

        # Separate on purpose as if fails here no need to revert visualizations' privacy
        revertable_privacy_change(metadata_table, old_privacy) do
          # Map saving actually doesn't changes privacy, but to keep on same reverting logic
          @table.map.save
          set_from_table_privacy(@table.privacy)
        end

        revertable_privacy_change(metadata_table, old_privacy,
                                  [metadata_table.table_visualization] + metadata_table.affected_visualizations) do
          propagate_to([metadata_table.table_visualization])
          notify_privacy_affected_entities(metadata_table) if privacy_changed
        end

      rescue NoMethodError => exception
        CartoDB.notify_debug("#{exception.message} #{exception.backtrace}", {
          table_id: @table.id,
          table_name: @table.name,
          user_id: @table.user_id,
          data_import_id: @table.data_import_id
          })

        raise exception
      end
    end

    def set_from_visualization(visualization)
      set_public                if visualization.public?
      set_public_with_link_only if visualization.public_with_link?
      set_private               if visualization.private? or visualization.organization?
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
      when ::UserTable::PRIVACY_PUBLIC
        set_public
      when ::UserTable::PRIVACY_LINK
        set_public_with_link_only
      else
        set_private
      end
    end

    # Propagation flow: Table -> Table PrivacyManager -> Visualization -> Visualization NamedMap
    def propagate_to(visualizations, table_privacy_changed = false)
      visualizations.each do |visualization|
        visualization.store_using_table({
                                          privacy_text: ::UserTable::PRIVACY_VALUES_TO_TEXTS[privacy],
                                          map_id: visualization.map_id
                                        }, table_privacy_changed)
      end

      self
    end

    def set_public
      self.privacy = ::UserTable::PRIVACY_PUBLIC
      set_database_permissions(grant_query)
      overviews_service = Carto::OverviewsService.new(owner.in_database)
      overviews_service.overview_tables(fully_qualified_table_name(table.name)).each do |overview_table|
        set_database_permissions(grant_query(overview_table))
      end
      self
    end

    def set_private
      self.privacy = ::UserTable::PRIVACY_PRIVATE
      set_database_permissions(revoke_query)
      overviews_service = Carto::OverviewsService.new(owner.in_database)
      overviews_service.overview_tables(fully_qualified_table_name(table.name)).each do |overview_table|
        set_database_permissions(revoke_query(overview_table))
      end
      self
    end

    def set_public_with_link_only
      self.privacy = ::UserTable::PRIVACY_LINK
      set_database_permissions(grant_query)
      overviews_service = Carto::OverviewsService.new(owner.in_database)
      overviews_service.overview_tables(fully_qualified_table_name(table.name)).each do |overview_table|
        set_database_permissions(grant_query(overview_table))
      end
      self
    end

    def owner
      @owner ||= ::User.where(id: table.user_id).first
    end

    def set_database_permissions(query)
      owner.in_database(as: :superuser).run(query)
    end

    def revoke_query(table_name = @table.name)
      %{
        REVOKE SELECT ON #{fully_qualified_table_name(table_name)}
        FROM #{CartoDB::PUBLIC_DB_USER}
      }
    end

    def grant_query(table_name = nil)
      table_name ||= table.name
      %{
        GRANT SELECT ON #{fully_qualified_table_name(table_name)}
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

      if errors.length > 0
        CartoDB.notify_error("Errors reverting Table privacy", user_id: metadata_table.user_id,
                                                               table_id: metadata_table.id,
                                                               errors: errors)
      end
    end

    def notify_privacy_affected_entities(metadata_table)
      propagate_to(metadata_table.affected_visualizations, true)
      update_cdb_tablemetadata
    end

    def fully_qualified_table_name(table_name)
      %{"#{owner.database_schema}"."#{table_name}"}
    end
  end
end
