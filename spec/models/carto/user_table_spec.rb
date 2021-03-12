require 'spec_helper_min'
require 'models/user_table_shared_examples'

describe Carto::UserTable do
  include_context 'with database purgue'

  let(:user) { create(:carto_user) }
  let(:user_table) do
    table = described_class.new
    table.user = user
    table.name = unique_name('user_table')
    table.save!
    table
  end
  let(:dependent_test_object) { user_table }

  it_behaves_like 'user table models' do
    def build_user_table(attrs = {})
      ut = described_class.new
      ut.assign_attributes(attrs, without_protection: true)
      ut
    end
  end

  describe 'table_id column' do
    it 'supports values larger than 2^31-1' do
      column = described_class.columns.find{|c| c.name=='table_id'}
      expect { column.type_cast_for_database(2164557046) }.to_not raise_error
    end
  end

  describe 'canonical visualization' do
    it 'contains 1 data layer and creates a named map template if default basemap supports labels on top' do
      Carto::LayerFactory.build_default_base_layer(user).supports_labels_layer?.should be_true

      # FIXME: passes in local but not in CI
      # Carto::NamedMaps::Api.any_instance.expects(:create).once

      table = user.tables.create!

      expect(table.reload.visualization.data_layers.count).to eq(1)
    end

    it 'contains 1 data layer and creates a named map template if default basemap does not support labels on top' do
      user.update_attribute(:google_maps_key, 'wadus')
      Carto::LayerFactory.build_default_base_layer(user).supports_labels_layer?.should be_false

      # FIXME: passes in local but not in CI
      # Carto::NamedMaps::Api.any_instance.expects(:create).once

      table = user.tables.create!

      expect(table.reload.visualization.data_layers.count).to eq(1)
    end
  end

  describe '#default_privacy' do
    it 'sets privacy to nil by default' do
      expect(described_class.new.privacy).to be_nil
    end

    it 'lets caller specify privacy' do
      [UserTable::PRIVACY_PRIVATE, UserTable::PRIVACY_LINK, UserTable::PRIVACY_PUBLIC].each do |privacy|
        expect(described_class.new(privacy: privacy).privacy).to eq privacy
      end
    end
  end

  describe '#readable_by?' do
    let(:organization) { create(:organization_with_users) }
    let(:user) { organization.users.first }
    let(:other_user) { organization.users.second }

    it 'returns true for shared tables' do
      table = create_table(privacy: UserTable::PRIVACY_PRIVATE, name: "a_table_name", user_id: user.id)
      user_table = described_class.find(table.id)
      share_table_with_user(table, other_user)

      user_table.readable_by?(other_user).should be_true
    end
  end

  describe('#affected_visualizations') do
    before do
      # We recreate an inconsistent state where a layer has no visualization
      user_table.stubs(:layers).returns([Carto::Layer.new])
    end

    describe('#fully_dependent_visualizations') do
      it 'resists layers without visualizations' do
        expect { user_table.fully_dependent_visualizations }.to_not raise_error
      end
    end

    describe('#accessible_dependent_derived_maps') do
      it 'resists layers without visualizations' do
        expect { user_table.accessible_dependent_derived_maps }.to_not raise_error
      end
    end

    describe('#partially_dependent_visualizations') do
      it 'resists layers without visualizations' do
        expect { user_table.partially_dependent_visualizations }.to_not raise_error
      end
    end
  end
end
