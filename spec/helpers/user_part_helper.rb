module UserPartHelper
  def create_org(org_name, org_quota, org_seats)
    organization = Carto::Organization.new
    organization.name = unique_name(org_name)
    organization.quota_in_bytes = org_quota
    organization.seats = org_seats
    organization.save
    organization
  end

  def tables_including_shared(user)
    Carto::VisualizationQueryBuilder
      .new
      .with_owned_by_or_shared_with_user_id(user.id)
      .with_type(Carto::Visualization::TYPE_CANONICAL)
      .build.map(&:table)
  end

  shared_context 'user spec configuration' do
    before(:all) do
      create_account_type_fg('ORGANIZATION USER')
      bypass_named_maps

      @user_password = 'admin123'
      puts "\n[rspec][user_spec] Creating test user databases..."
      @user     = create_user :email => 'admin@example.com', :username => 'admin', :password => @user_password
      @user2    = create_user :email => 'user@example.com',  :username => 'user',  :password => 'user123'

      puts "[rspec][user_spec] Loading user data..."
      reload_user_data(@user) && @user.reload

      puts "[rspec][user_spec] Running..."
    end

    before(:each) do
      bypass_named_maps
      CartoDB::Varnish.any_instance.stubs(:send_command).returns(true)
      CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
      Table.any_instance.stubs(:update_cdb_tablemetadata)
    end

    after(:all) do
      bypass_named_maps
      @user.destroy
      @user2.destroy
      @account_type.destroy if @account_type
      @account_type_org.destroy if @account_type_org
    end
  end
end
