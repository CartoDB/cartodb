require 'helpers/unique_names_helper'

module CartoDB
  module Factories
    include UniqueNamesHelper

    def new_organization(attributes = {})
      organization = Organization.new

      organization.name =             attributes[:name] || unique_name('organization')
      organization.seats =            attributes[:seats] || 10
      organization.quota_in_bytes =   attributes[:quota_in_bytes] || 100.megabytes
      organization.geocoding_quota =  attributes[:geocoding_quota] || 1000
      organization.here_isolines_quota =    attributes[:here_isolines_quota] || 1000
      organization.obs_snapshot_quota = attributes[:obs_snapshot_quota] || 1000
      organization.obs_general_quota = attributes[:obs_general_quota] || 1000
      organization.mapzen_routing_quota =    attributes[:mapzen_routing_quota] || 1000
      organization.map_view_quota =   attributes[:map_view_quota] || 100000
      organization.website =          attributes[:website] || 'carto.com'
      organization.description =      attributes[:description] || 'Lorem ipsum dolor sit amet'
      organization.display_name =     attributes[:display_name] || 'Vizzuality Inc'
      organization.discus_shortname = attributes[:discus_shortname] || 'cartodb'
      organization.location = attributes[:location] || 'Madrid'
      organization.twitter_username = attributes[:twitter_username] || 'cartodb'
      organization.twitter_datasource_enabled = attributes[:twitter_datasource_enabled] || false
      organization.google_maps_key = attributes[:google_maps_key] || nil
      organization.google_maps_private_key = attributes[:google_maps_private_key] || nil
      organization.builder_enabled = attributes[:builder_enabled] || false
      organization.password_expiration_in_d = attributes[:password_expiration_in_d]

      organization
    end

    def create_organization(attributes = {})
      organization = new_organization(attributes)
      organization.save
      organization
    end

    def create_organization_with_owner(attributes = {})
      organization = create_organization(attributes)
      owner = create_user(quota_in_bytes: 50.megabytes)
      uo = CartoDB::UserOrganization.new(organization.id, owner.id)
      uo.promote_user_to_admin
      organization.reload
      owner.reload
      organization
    end

    def create_organization_with_users(attributes = {})
      organization = create_organization_with_owner(attributes)
      create_user(organization: organization,
                  organization_id: organization.id,
                  quota_in_bytes: 20.megabytes,
                  account_type: 'ORGANIZATION USER')
      organization.reload
      organization
    end
  end
end

class OrganizationFactory
  include CartoDB::Factories
end
