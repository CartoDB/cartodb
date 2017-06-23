
module Carto
  module Admin
    class UserPublicMapAdapter
      extend Forwardable

      delegate [:id, :name, :username, :disqus_shortname, :avatar, :avatar_url, :remove_logo?, :has_organization?,
                :organization, :organization_id, :twitter_username, :location, :public_url, :subdomain,
                :sql_safe_database_schema, :account_type, :google_maps_query_string, :basemaps, :default_basemap,
                :name_or_username] => :user

      attr_reader :user

      def initialize(user)
        @user = user
      end

      def public_table_count
        @public_table_count ||= Carto::VisualizationQueryBuilder.user_public_tables(@user).build.count
      end

      def public_visualization_count
        @public_visualization_count ||= Carto::VisualizationQueryBuilder.user_public_visualizations(@user).build.count
      end

      def all_visualization_count
        @all_visualization_count ||= Carto::VisualizationQueryBuilder.user_all_visualizations(@user).build.count
      end

    end
  end
end
