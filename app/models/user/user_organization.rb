module CartoDB
  class UserOrganization
    
    def initialize(org_id, owner_id)
      @user = User.where(:id => owner_id).first
      raise "The organization needs a owner" if user.nil?
      if !user.organization_id.nil? && user.organization_id != org_id
        raise "The user already has a organization and it's not #{org_id}"
      end
      @organization = Organization.where(:id => org_id).first
      raise "The user needs a organization" if organization.nil?
      if !organization.owner_id.nil? && organization.owner_id != owner_id
        raise "The organization already has a owner and it's not #{owner_id}"
      end
    end

    def promote_user_to_admin
      @user.create_schema(@user.database_schema, @user.database_username)
      @user.set_database_permissions_in_schema(@user.database_schema)
      @user.set_database_search_path
    end

  end
end
