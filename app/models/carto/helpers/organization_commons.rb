module Carto
  module OrganizationCommons

    class OrganizationWithoutOwner < StandardError

      attr_reader :organization

      def initialize(organization)
        @organization = organization
        super 'Organization has no owner'
      end

    end

    # create the key that is used in redis
    def key
      "rails:orgs:#{name}"
    end

    # save orgs basic metadata to redis for other services (node sql api, geocoder api, etc)
    # to use
    def save_metadata
      $users_metadata.HMSET(
        key,
        'id', id,
        'geocoding_quota', geocoding_quota,
        'here_isolines_quota', here_isolines_quota,
        'mapzen_routing_quota', mapzen_routing_quota,
        'google_maps_client_id', google_maps_key,
        'google_maps_api_key', google_maps_private_key,
        'period_end_date', period_end_date,
        'geocoder_provider', geocoder_provider,
        'isolines_provider', isolines_provider,
        'routing_provider', routing_provider
      )
    end

    def destroy_metadata
      $users_metadata.DEL key
    end

    def period_end_date
      owner&.period_end_date
    end

    def destroy_related_resources
      groups.each(&:destroy_group_with_extension) if destroy_assets
    end

  end
end
