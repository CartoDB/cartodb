require_relative 'user_presenter'

module Carto
  module Api
    class GroupPresenter

      # Available fetching options:
      # - fetch_shared_tables_count
      # - fetch_shared_maps_count
      # - fetch_members
      def initialize(group, fetching_options = {})
        @group = group
        @fetching_options = fetching_options
      end

      def to_poro
        poro = {
          id: @group.id,
          organization_id: @group.organization_id,
          name: @group.name,
          display_name: @group.display_name
        }

        if @fetching_options[:fetch_shared_tables_count] == true
          poro.merge!({ shared_tables_count: shared_tables_count })
        end
        if @fetching_options[:fetch_shared_maps_count] == true
          poro.merge!({ shared_maps_count: shared_maps_count })
        end
        if @fetching_options[:fetch_members] == true
          poro.merge!({ members: members })
        end

        poro
      end

      private

      def shared_tables_count
        shared_visualizations_query.where(:visualizations => { type: Carto::Visualization::TYPE_CANONICAL }).count
      end

      def shared_maps_count
        shared_visualizations_query.where(:visualizations => { type: Carto::Visualization::TYPE_DERIVED }).count
      end

      def shared_visualizations_query
        Carto::SharedEntity.where(recipient_id: @group.id).joins(:visualization)
      end

      def members
        @group.users.map { |u| Carto::Api::UserPresenter.new(u).to_poro }
      end

    end
  end
end
