require_relative '../../../spec/spec_helper.rb'
require_relative '../worker'
describe CartoDB::Relocator::Worker do
  it "should move an user" do
    User.any_instance.stubs(:create_in_central).returns(true)
    User.any_instance.stubs(:update_in_central).returns(true)
    (org, user_a, user_b, user_c) = prepare_organization
    CartoDB::Relocator::Worker.organize(user_c, org)
  end

  def prepare_organization
    org = create_organization
    user_a = create_user(:quota_in_bytes => 1.megabyte, :table_quota => 400)
    user_org = CartoDB::UserOrganization.new(org.id, user_a.id)
    user_org.promote_user_to_admin
    org.reload

    user_b = create_user(
      :quota_in_bytes => 1.megabyte, :table_quota => 400,
      :organization => org
    )
    org.reload

    user_c = create_user(
      :quota_in_bytes => 1.megabyte, :table_quota => 400
    )
    user_a.database_name.should eq user_b.database_name
    user_a.database_name.should_not eq user_c.database_name

    return org, user_a, user_b, user_c
  end
  def create_organization
    organization = Organization.new

    organization.name = 'wadus-org'
    organization.quota_in_bytes = 3.megabytes
    organization.seats = 10
    organization.save

    organization
  end
end
