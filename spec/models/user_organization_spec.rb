require_relative '../spec_helper'

describe UserOrganization do

  describe 'promoting a user to owner' do
    include_context 'visualization creation helpers'

    after(:all) do
      stub_named_maps_calls
      @organization.destroy_cascade if @organization
      @owner = ::User.where(id: @owner.id).first
      @owner.destroy if @owner
    end

    # See #3534: Quota trigger re-creation not done correctly when promoting user to org
    it 'recreates existing tables triggers' do
      ::User.any_instance.stubs(:create_in_central).returns(true)
      ::User.any_instance.stubs(:update_in_central).returns(true)
      @organization = Organization.new(quota_in_bytes: 1234567890, name: 'wadus', seats: 5).save

      @owner = create_user(:quota_in_bytes => 524288000, :table_quota => 500)
      table = create_random_table(@owner)
      id = table.id
      table.insert_row!({})
      table.rows_counted.should == 1

      owner_org = CartoDB::UserOrganization.new(@organization.id, @owner.id)
      owner_org.promote_user_to_admin
      @owner.reload

      table = UserTable.where(id: id).first.service
      table.insert_row!({})
      table.rows_counted.should == 2
    end

  end

  # See #5477 Error assigning as owner a user with non-cartodbfied tables
  it 'can assign an owner user having non-cartodbfied tables' do
    ::User.any_instance.stubs(:create_in_central).returns(true)
    ::User.any_instance.stubs(:update_in_central).returns(true)
    @organization = Organization.new(quota_in_bytes: 1234567890, name: 'non-cartodbfied-org', seats: 5).save
    @owner = create_user(quota_in_bytes: 524288000, table_quota: 500)
    @owner.in_database.run('create table no_cartodbfied_table (test integer)')

    @owner.real_tables.count.should == 1

    owner_org = CartoDB::UserOrganization.new(@organization.id, @owner.id)
    owner_org.promote_user_to_admin
    @owner.reload

    @owner.real_tables.count.should == 1

    @owner.database_schema.should == @owner.username
  end

  it 'keeps tables and metadata if table movement fails' do
    ::User.any_instance.stubs(:create_in_central).returns(true)
    ::User.any_instance.stubs(:update_in_central).returns(true)

    # This is coupled to DBService#move_tables_to_schema implementation, but we need a way to simulate a failure
    Carto::UserTable.stubs(:find_by_user_id_and_name).raises(StandardError.new("Simulation of table movement failure"))

    @organization = Organization.new(quota_in_bytes: 1234567890, name: 'org-that-will-fail', seats: 5).save
    @owner = create_user(quota_in_bytes: 524288000, table_quota: 500)
    @owner.in_database.run('create table no_cartodbfied_table (test integer)')

    # Checks that should also be met afterwards
    @owner.database_schema.should == 'public'
    @owner.real_tables.count.should == 1

    @owner.db_service.schema_exists?(@owner.username).should == false

    # Promote
    owner_org = CartoDB::UserOrganization.new(@organization.id, @owner.id)
    expect { owner_org.promote_user_to_admin }.to raise_error StandardError
    @owner.reload

    @owner.database_schema.should == 'public'
    @owner.real_tables.count.should == 1

    @owner.db_service.schema_exists?(@owner.username).should == false
  end
end
