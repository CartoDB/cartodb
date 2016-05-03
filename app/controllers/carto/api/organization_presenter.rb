# encoding: utf-8

require_relative 'group_presenter'

module Carto
  module Api
    class OrganizationPresenter

      def initialize(organization)
        @organization = organization
      end

      def to_poro
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
            :email      => @organization.owner ? @organization.owner.email : nil,
            :groups     => @organization.owner && @organization.owner.groups ? @organization.owner.groups.map { |g| Carto::Api::GroupPresenter.new(g).to_poro } : []
          },
          :quota_in_bytes           => @organization.quota_in_bytes,
          :unassigned_quota         => @organization.unassigned_quota,
          :geocoding_quota          => @organization.geocoding_quota,
          :here_isolines_quota      => @organization.here_isolines_quota,
          :here_isolines_block_price => @organization.here_isolines_block_price,
          :obs_snapshot_quota      => @organization.obs_snapshot_quota,
          :obs_snapshot_block_price => @organization.obs_snapshot_block_price,
          :map_view_quota           => @organization.map_view_quota,
          :twitter_datasource_quota => @organization.twitter_datasource_quota,
          :map_view_block_price     => @organization.map_view_block_price,
          :geocoding_block_price    => @organization.geocoding_block_price,
          :seats                    => @organization.seats,
          :twitter_username         => @organization.twitter_username,
          :location                 => @organization.location,
          :updated_at               => @organization.updated_at,
          :website          => @organization.website,
          :admin_email      => @organization.admin_email,
          :avatar_url       => @organization.avatar_url
        }
      end

    end
  end
end
