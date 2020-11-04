require_dependency 'carto/helpers/auth_token_generator'

class Group < Sequel::Model

  include Carto::AuthTokenGenerator

  def organization
    Carto::Organization.find_by(id: organization_id) if organization_id
  end

end
