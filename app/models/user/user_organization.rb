module CartoDB
  class UserOrganization

    def initialize(org_id, owner_id)
      @owner = ::User.where(:id => owner_id).first
      raise "The organization needs a owner" if @owner.nil?
      if !@owner.organization_id.nil? && @owner.organization_id != org_id
        raise "The user already has a organization and it's not #{org_id}"
      end
      @organization = Organization.where(:id => org_id).first
      raise "The user needs a organization" if @organization.nil?
      if !@organization.owner_id.nil? && @organization.owner_id != owner_id
        raise "The organization already has a owner and it's not #{owner_id}"
      end
      @users = ::User.where(:organization_id => org_id)
      @active = false
      if !@organization.owner_id.nil?
        @active = true
      end
    end

    def promote_user_to_admin
      raise "Organization is already active. You can't assign an admin" if @active
      @owner.organization_id = @organization.id
      @owner.db_service.move_to_own_schema
      @organization.owner_id = @owner.id
      @organization.admin_email = @owner.email
      @organization.save
      @owner.organization = @organization

      # WIP: CartoDB/cartodb-management#4467
      # Added after commenting it in setup_organization_user_schema to avoid configure_database to reset permissions
      @owner.db_service.reset_user_schema_permissions

      @owner.db_service.setup_organization_user_schema
      @owner.save
      @owner.db_service.monitor_user_notification
      @active = true
    end

    def owner
      @owner
    end

    def organization
      @organization
    end

    def users
      @users
    end

    def self.from_org_id(organization_id)
      organization = Organization.where(:id => organization_id).first
      raise "Organization with id #{org_id} does not exist" if organization.nil?
      return CartoDB::UserOrganization.new(organization.id, organization.owner_id)
    end

    def self.is_a_user?(name)
      return ::User.where(:username => name).count > 0 ? true : false
    end

    def self.is_a_organization?(name)
      return Organization.where(:username => name).count > 0 ? true : false
    end

    def self.user_belongs_to_organization?(name)
      if CartoDB::UserOrganization.is_a_user?(name)
        begin
          organization_id = ::User.select(:organization_id).where(:username => name).first[:organization_id]
          return Organization.select(:name).where(:id => organization_id).first[:name]
        rescue
          return nil
        end
      else
        return nil
      end
    end

  end
end
