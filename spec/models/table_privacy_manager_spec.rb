require_relative '../spec_helper'

describe CartoDB::TablePrivacyManager do
  before(:all) do
    @user = FactoryGirl.create(:valid_user, quota_in_bytes: 524288000, table_quota: 500, private_tables_enabled: true)
  end

  before(:each) do
    bypass_named_maps
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

  shared_examples_for 'table create_canonical_visualization support' do
    describe '#apply_privacy_change' do
      it 'changes canonical visualization privacy' do
        table = create_table(user_id: @user.id, name: "aaa", privacy: UserTable::PRIVACY_PRIVATE)
        previous_privacy = table.instance_eval { previous_privacy }
        user_table = table.instance_eval { @user_table }
        privacy_changed = table.instance_eval { privacy_changed? }

        manager = CartoDB::TablePrivacyManager.new(user_table)
        manager.apply_privacy_change(table, previous_privacy, privacy_changed)
        user_table.reload
        user_table.table_visualization.privacy.should eq Carto::Visualization::PRIVACY_PRIVATE

        table.privacy = UserTable::PRIVACY_PUBLIC
        table.save
        user_table.reload
        user_table.table_visualization.privacy.should eq Carto::Visualization::PRIVACY_PUBLIC
      end
    end
  end

  describe 'legacy models' do
    it_behaves_like 'table create_canonical_visualization support'

    before(:each) do
      Table.any_instance.stubs(:model_class).returns(::UserTable)
    end
  end

  describe 'new models' do
    it_behaves_like 'table create_canonical_visualization support'

    before(:each) do
      Table.any_instance.stubs(:model_class).returns(Carto::UserTable)
    end
  end
end
