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
    end

    def set_from_visualization(visualization)
      set_public                if visualization.public?
      set_public_with_link_only if visualization.public_with_link?
      set_private               if visualization.private? or visualization.organization?
      table.update(privacy: privacy)
      self
    end

    def propagate_to_varnish
      raise 'table privacy cannot be nil' unless privacy
      # TODO: Improve this, hack because tiler checks it
      invalidate_varnish_cache
      self
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
      self
    end

    def set_private
      self.privacy = ::UserTable::PRIVACY_PRIVATE
      set_database_permissions(revoke_query)
      self
    end

    def set_public_with_link_only
      self.privacy = ::UserTable::PRIVACY_LINK
      set_database_permissions(grant_query)
    end

    def owner
      @owner ||= ::User.where(id: table.user_id).first
    end

    def set_database_permissions(query)
      owner.in_database(as: :superuser).run(query)
    end

    def revoke_query
      %Q{
        REVOKE SELECT ON "#{owner.database_schema}"."#{table.name}"
        FROM #{CartoDB::PUBLIC_DB_USER}
      }
    end

    def grant_query
      %Q{
        GRANT SELECT ON "#{owner.database_schema}"."#{table.name}"
        TO #{CartoDB::PUBLIC_DB_USER};
      }
    end

    def invalidate_varnish_cache
      table.invalidate_varnish_cache(false)
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
      propagate_to_varnish
      propagate_to(metadata_table.affected_visualizations, true)
    end

  end
end
