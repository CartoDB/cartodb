module CartoDB
  class UserOrganization
    
    def initialize(org_id, owner_id)
      @owner = User.where(:id => owner_id).first
      raise "The organization needs a owner" if @owner.nil?
      if !@owner.organization_id.nil? && @owner.organization_id != org_id
        raise "The user already has a organization and it's not #{org_id}"
      end
      @organization = Organization.where(:id => org_id).first
      raise "The user needs a organization" if @organization.nil?
      if !@organization.owner_id.nil? && @organization.owner_id != owner_id
        raise "The organization already has a owner and it's not #{owner_id}"
      end
      @users = User.where(:organization_id => org_id)
      @active = false
      if !@organization.owner_id.nil?
        @active = true
      end
    end

    def promote_user_to_admin
      raise "Organization is already active. You can't assign an admin" if @active
      @owner.create_schema(@owner.username, @owner.database_username)
      @owner.grant_all_on_user_schema_queries
      move_user_tables_to_schema(@owner.id)
      @owner.organization_id = @organization.id
      @owner.database_schema = @owner.username
      @organization.owner_id = @owner.id
      @organization.save
      @owner.create_public_db_user
      @owner.set_database_search_path
      @owner.load_cartodb_functions
      @owner.set_user_privileges
      @owner.rebuild_quota_trigger
      @owner.save
      @owner.monitor_user_notification
      @active = true
    end

    def owner
      return @owner
    end
    
    def organization
      return @organization
    end
   
    def users
      return @users
    end

    #def add_user_to_organization(user_id)
    #  user = User.where(:id => user_id).first
    #  raise "User with id #{user_id} doesn't exist" if user.nil?
    #end

    def self.from_org_id(organization_id)
      organization = Organization.where(:id => organization_id).first
      raise "Organization with id #{org_id} does not exist" if organization.nil?
      return CartoDB::UserOrganization.new(organization.id, organization.owner_id)
    end
    
    def self.is_a_user?(name)
      return User.where(:username => name).count > 0 ? true : false
    end

    def self.is_a_organization?(name)
      return Organization.where(:username => name).count > 0 ? true : false
    end

    def self.user_belongs_to_organization?(name)
      if CartoDB::UserOrganization.is_a_user?(name)
        begin
          organization_id = User.select(:organization_id).where(:username => name).first[:organization_id]
          return Organization.select(:name).where(:id => organization_id).first[:name]
        rescue
          return nil
        end
      else
        return nil
      end
    end

    private
    def move_user_tables_to_schema(user_id)
      user = User.where(:id => user_id).first
      raise "User doesn't exist" if user.nil?
      user.real_tables.each do |t|
        puts "TABLE: #{t}"
        user.in_database(as: :superuser) do |database|
          database.run(%Q{ALTER TABLE public.#{t[:relname]} SET SCHEMA \"#{user.username}\"})
        end
      end
    end
  end
end
