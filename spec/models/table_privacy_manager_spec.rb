require_relative '../spec_helper'

describe CartoDB::TablePrivacyManager do
  before(:all) do
    @user = FactoryGirl.create(:valid_user, quota_in_bytes: 524288000, table_quota: 500, private_tables_enabled: true)
  end

  before(:each) do
    stub_named_maps_calls
  end

  after(:all) do
    @user.destroy
  end

  it 'should not change table privacy if setting it fails' do
    table = ::Table.new
    table.user_id = @user.id
    table.name = 'manolo'
    table.privacy = Carto::UserTable::PRIVACY_PRIVATE
    table.save

    table.privacy == Carto::UserTable::PRIVACY_PUBLIC

    table.stubs(:set_from_table_privacy) { raise StandardError }

    expect { table.save to_raise }.to raise_exception StandardError

    table.privacy.should == Carto::UserTable::PRIVACY_PRIVATE
  end
end
