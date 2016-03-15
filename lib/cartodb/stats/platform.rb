module CartoDB
  module Stats
    class Platform

      # Total users created
      def users
        return ::User.count
      end

      # Total users that aren't FREE
      def pay_users
        Carto::AccountType.new.pay_users
      end

      # Total datasets
      def datasets
        return UserTable.count
      end

      # Total seats among orgs
      # Returns a hash with reserved seats and used seats
      def seats_among_orgs
        seats_used = ::User.where('organization_id IS NOT NULL').count
        seats_reserved = Organization.sum(:seats)
        return {'used' => seats_used, 'reserved' => seats_reserved}
      end

      # Shared objects among orgs
      # Returns a hash with shared visualizations and shared datasets
      def shared_objects_among_orgs
        shared_objects = {}
        visualization_types_sql = "SELECT COUNT(*), visualizations.type FROM shared_entities, visualizations WHERE entity_id=visualizations.id::uuid GROUP BY type"
        db = ::Rails::Sequel.configuration.environment_for(Rails.env)
        conn = Sequel.connect(db)
        conn.fetch(visualization_types_sql).all.each do |vt|
          if vt[:type] == 'table'
            shared_objects['datasets'] = vt[:count]
          elsif vt[:type] == 'derived'
            shared_objects['visualizations'] = vt[:count]
          end
        end
        conn.disconnect
        return shared_objects
      end

      # Total visualizations
      def visualizations
        Carto::Visualization.where("type = 'derived'").count
      end

      # Total maps
      def maps
        Carto::Visualization.where("type in ('derived', 'table', 'slide')").count
      end

      # Total active users
      def active_users
        active_users = "select count(distinct(user_id)) from visualizations where type in ('derived', 'table', 'slide')"
        db = ::Rails::Sequel.configuration.environment_for(Rails.env)
        conn = Sequel.connect(db)
        au_count = conn.fetch(active_users).first[:count]
        conn.disconnect
        return au_count
      end

      # Total likes
      def likes
        return Carto::Like.count
      end

    end
  end
end
