require 'spec_helper_unit'

describe Carto::Group do

  describe '#valid_group_name' do

    it 'returns valid names' do
      valid_names = ['A Group', 'My5Group']
      valid_names.each do |valid_name|
        Carto::Group.valid_group_name(valid_name).should == valid_name
      end
    end

    it 'returns g_ prepended at the name if does not begin with a letter' do
      not_valid_names = { '5 group' => 'g_5 group' }
      not_valid_names.each do |name, valid|
        Carto::Group.valid_group_name(name).should == valid
      end
    end

    it 'changes not alphanumeric or spaces characters to underscores' do
      not_valid_names = { '/group' => 'g_group', 'g/group' => 'g_group' }
      not_valid_names.each do |name, valid|
        Carto::Group.valid_group_name(name).should == valid
      end
    end

  end

  describe 'organization behaviour' do
    include Carto::Factories::Visualizations

    let(:organization) { create(:organization) }
    let(:group) { create(:random_group, organization_id: organization.id) }

    it 'generates auth_tokens and save them for future accesses' do
      token = group.get_auth_token
      token.should be
      group.reload
      group.get_auth_token.should eq token
    end
  end
end
