module Concerns
  module CartodbCentralSynchronizable

    def create_in_central
      return true unless sync_data_with_cartodb_central?
      if self.is_a?(User) && self.organization
        cartodb_central_client.create_organization_user(self.organization, self)
      end
      return true
    end

    def update_in_central
      return true unless sync_data_with_cartodb_central?
      if self.is_a?(User) && self.organization
        cartodb_central_client.update_organization_user(self.organization, @user)
      elsif self.is_a?(Organization)
        cartodb_central_client.update_organization(self)
      end
      return true
    end

    def delete_in_central
      return true unless sync_data_with_cartodb_central?
      if self.is_a?(User) && self.organization
        if self.organization.owner && self.organization.owner == self
          cartodb_central_client.delete_organization_user(self.organization, self)
        else
          raise "Can't destroy the organization owner"
        end
      end
      return true
    end

    def sync_data_with_cartodb_central?
      Cartodb.config[:cartodb_central_api] && Cartodb.config[:cartodb_central_api]['username'].present? && Cartodb.config[:cartodb_central_api]['password'].present?
    end

    def cartodb_central_client
      @cartodb_central_client ||= Cartodb::Central.new
    end

  end
end