# encoding: utf-8
require_relative '../../../lib/varnish/lib/cartodb-varnish'
require_relative '../user'

module CartoDB
  module Table
    class PrivacyManager
      def initialize(table)
        @table  = table
      end #initialize

      def set_public
        self.privacy = ::Table::PRIVACY_PUBLIC
        set_database_permissions(grant_query)
        self
      end #set_public

      def set_private
        self.privacy = ::Table::PRIVACY_PRIVATE
        set_database_permissions(revoke_query)
        self
      end #set_private

      def set_from_table_privacy(table_privacy)
        case table_privacy
          when ::Table::PRIVACY_PUBLIC
            set_public
          when ::Table::PRIVACY_LINK
            set_public_with_link_only
          else
            set_private
        end
      end #set_from_table_privacy

      def set_from(visualization)
        set_public                if visualization.public?
        set_public_with_link_only if visualization.public_with_link?
        set_private               if visualization.private?
        table.update(privacy: privacy)
        self
      end #set_from

      def propagate_to(visualization)
        visualization.store_using_table(::Table::PRIVACY_VALUES_TO_TEXTS[privacy])
        self
      end #propagate_to

      def propagate_to_redis_and_varnish
        raise 'table privacy cannot be nil' unless privacy
        $tables_metadata.hset redis_key, 'privacy', privacy
        invalidate_varnish_cache
        self
      end #propagate_to_redis_and_varnish

      private

      attr_reader   :table
      attr_accessor :privacy

      def set_public_with_link_only
        self.privacy = ::Table::PRIVACY_LINK
        set_database_permissions(grant_query)
      end #set_public_with_link_only

      def owner
        @owner ||= User.where(id: table.user_id).first
      end #owner

      def set_database_permissions(query)
        owner.in_database(as: :superuser).run(query)
      end #set_database_permissions

      def revoke_query
        %Q{
          REVOKE SELECT ON "#{table.name}"
          FROM #{CartoDB::PUBLIC_DB_USER}
        }
      end #revoke_query

      def grant_query
        %Q{
          GRANT SELECT ON "#{table.name}"
          TO #{CartoDB::PUBLIC_DB_USER};
        }
      end #grant_query

      def invalidate_varnish_cache
        Varnish.new.purge("#{varnish_key}")
      end #invalidate_varnish_cache

      def varnish_key
        "^#{table.owner.database_name}:(.*#{table.name}.*)|(table)$"
      end #varnish_key

      def redis_key
        "rails:#{table.owner.database_name}:#{table.name}"
      end #redis_key
    end # PrivacyManager
  end # Table
end # CartoDB

