require_relative '../spec_helper'

describe UserOrganization do

  describe 'promoting a user to owner' do
    include_context 'visualization creation helpers'

    after(:all) do
      stub_named_maps_calls
      @organization.destroy_cascade if @organization
      @owner = User.where(id: @owner.id).first
      @owner.destroy if @owner
    end

    # See #3534: Quota trigger re-creation not done correctly when promoting user to org
    it 'recreates existing tables triggers' do
      User.any_instance.stubs(:create_in_central).returns(true)
      User.any_instance.stubs(:update_in_central).returns(true)
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

end
