module CartoDB
  module Factories
    
    def new_organization(attributes = {})
      organization = Organization.new
      
      organization.name =             attributes[:name] || 'vizzuality'
      organization.seats =            attributes[:seats] || 10
      organization.quota_in_bytes =   attributes[:quota_in_bytes] || 100.megabytes
      organization.geocoding_quota =  attributes[:geocoding_quota] || 1000
      organization.map_view_quota =   attributes[:map_view_quota] || 100000
      organization.website =          attributes[:website] || 'cartodb.com'
      organization.description =      attributes[:description] || 'Lorem ipsum dolor sit amet'
      organization.display_name =     attributes[:display_name] || 'Vizzuality Inc'
      organization.discus_shortname = attributes[:discus_shortname] || 'cartodb'
      organization.twitter_username = attributes[:twitter_username] || 'cartodb'
      
      organization 
    end

    def create_organization(attributes = {})
      organization = new_organization(attributes)
      organization.save
      organization
    end

    def create_organization_with_users(attributes = {})
      organization = create_organization(attributes)
      owner = create_user
      #owner = FactoryGirl.create(:user)
      uo = CartoDB::UserOrganization.new(organization.id, owner.id)
      uo.promote_user_to_admin
      organization.reload
      user1 = create_user(:organization => organization, :organization_id => organization.id)
      organization.reload
      organization
    end
  end
end
