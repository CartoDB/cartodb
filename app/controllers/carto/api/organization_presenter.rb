
module Carto
  module Api
    class OrganizationPresenter

      def initialize(organization)
        @organization = organization
      end

      def to_poro(filtered_user = nil)
        return {} if @organization.nil?

        filtered_user ||= @organization.owner
        {
          :created_at       => @organization.created_at,
          :description      => @organization.description,
          :discus_shortname => @organization.discus_shortname,
          :display_name     => @organization.display_name,
          :id               => @organization.id,
          :name             => @organization.name,
          :owner            => {
            :id         => @organization.owner ? @organization.owner.id : nil,
            :username   => @organization.owner ? @organization.owner.username : nil,
            :avatar_url => @organization.owner ? @organization.owner.avatar_url : nil,
            :email      => @organization.owner ? @organization.owner.email : nil
          },
          :quota_in_bytes           => @organization.quota_in_bytes,
          :geocoding_quota          => @organization.geocoding_quota,
          :map_view_quota           => @organization.map_view_quota,
          :twitter_datasource_quota => @organization.twitter_datasource_quota,
          :map_view_block_price     => @organization.map_view_block_price,
          :geocoding_block_price    => @organization.geocoding_block_price,
          :seats                    => @organization.seats,
          :twitter_username         => @organization.twitter_username,
          :updated_at               => @organization.updated_at,
          :users => @organization.users.reject { |item| filtered_user && item.id == filtered_user.id }
            .map { |u|
            {
              :id         => u.id,
              :username   => u.username,
              :avatar_url => u.avatar_url
            }
          },
          :website          => @organization.website,
          :avatar_url       => @organization.avatar_url
        }
      end

    end
  end
end
