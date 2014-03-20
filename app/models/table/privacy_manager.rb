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
        self.privacy = ::Table::PUBLIC
        set_database_permissions(grant_query)
        self
      end #set_public

      def set_private
        self.privacy = ::Table::PRIVATE
        set_database_permissions(revoke_query)
        self
      end #set_private

      def set_from(visualization)
        set_public  if visualization.public?
        set_private if visualization.private?
        table.update(privacy: privacy)
        self
      end #set_from

      def propagate_to(visualization)
        visualization.store_using_table(privacy_text)
        self
      end #propagate_to

      def propagate_to_redis_and_varnish
        raise 'table privacy cannot be nil' unless privacy

        $tables_metadata.hset redis_key, "privacy", privacy
        invalidate_varnish_cache
        self
      end #propagate_to_redis_and_varnish

      private

      attr_reader   :table
      attr_accessor :privacy

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
        "^#{table.database_name}:(.*#{table.name}.*)|(table)$"
      end #varnish_key

      def redis_key
        "rails:#{table.database_name}:#{table.name}"
      end #redis_key

      def privacy_text
        return 'public' if privacy == ::Table::PUBLIC
        return 'private'
      end #privacy_text
    end # PrivacyManager
  end # Table
end # CartoDB

