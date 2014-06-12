require 'spec_helper'

describe Organization do

  describe '#add_user_to_org' do
    it 'Tests adding a user to an organization' do
      org_name = 'wadus'
      org_quota = 1234567890
      org_seats = 5

      user = create_user(:quota_in_bytes => 524288000, :table_quota => 500)
      username = user.username

      organization = Organization.new

      organization.name = org_name
      organization.quota_in_bytes = org_quota
      organization.seats = org_seats
      organization.save
      organization.valid?.should eq true
      organization.errors.should eq Hash.new

      user.organization = organization
      user.save

      user = User.where(username: username).first
      user.should_not be nil

      user.organization_id.should_not eq nil
      user.organization_id.should eq organization.id
      user.organization.should_not eq nil
      user.organization.id.should eq organization.id
      user.organization.name.should eq org_name
      user.organization.quota_in_bytes.should eq org_quota
      user.organization.seats.should eq org_seats
    end
  end

end
