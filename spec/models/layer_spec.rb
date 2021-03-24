require 'spec_helper'
require 'models/layer_shared_examples'

describe Layer do
  it_behaves_like 'Layer model' do
    let(:layer_class) { described_class }
    let(:user) { create(:valid_user, private_tables_enabled: true) }

    def create_map(options = {})
      Map.create(options)
    end

    def add_layer_to_entity(entity, layer)
      entity.add_layer(layer)
    end

    before do
      @quota_in_bytes = 500.megabytes
      @table_quota = 500
      @table = Table.new
      @table.user_id = user.id
      @table.save
      bypass_named_maps
    end

    describe '#copy' do
      it 'returns a copy of the layer' do
        layer       = layer_class.create(kind: 'carto', options: { style: 'bogus' })
        layer_copy  = layer.copy

        layer_copy.kind.should    == layer.kind
        layer_copy.options.should == layer.options
        layer_copy.id.should be_nil
      end
    end
  end

  describe '#affected_table_names' do
    include UniqueNamesHelper

    before do
      helper = TestUserFactory.new
      @organization = create(:organization, quota_in_bytes: 1000000000000)
      @owner = helper.create_owner(@organization)
      @nonhyphen_user = helper.create_test_user(unique_name('user'), @organization)
      @hyphen_user = helper.create_test_user(unique_name('user-'), @organization)
      @nonhyphen_table = create(:user_table, user: @nonhyphen_user, name: unique_name('table'))
      @subuser_table = create(:user_table, user: @hyphen_user, name: unique_name('table'))
      @hyphen_table = create(:user_table, user: @hyphen_user, name: unique_name('table-'))
      @hyphen_user_layer = Layer.new
      @hyphen_user_layer.stubs(:user).returns(@hyphen_user)

      @nonhyphen_layer = Layer.new
      @nonhyphen_layer.stubs(:user).returns(@nonhyphen_user)
    end

    it 'returns normal tables' do
      @nonhyphen_layer.send(:affected_table_names, "SELECT * FROM #{@nonhyphen_table.name}")
                      .should eq ["#{@nonhyphen_user.username}.#{@nonhyphen_table.name}"]
    end

    it 'returns tables from users with hyphens' do
      @hyphen_user_layer.send(:affected_table_names, "SELECT * FROM #{@subuser_table.name}")
                        .should eq ["\"#{@hyphen_user.username}\".#{@subuser_table.name}"]
    end

    it 'returns table with hyphens in the name' do
      @hyphen_user_layer.send(:affected_table_names, "SELECT * FROM \"#{@hyphen_table.name}\"")
                        .should eq ["\"#{@hyphen_user.username}\".\"#{@hyphen_table.name}\""]
    end

    it 'returns multiple tables' do
      @hyphen_user_layer.send(:affected_table_names, "SELECT * FROM \"#{@hyphen_table.name}\", #{@subuser_table.name}")
                        .should =~ ["\"#{@hyphen_user.username}\".\"#{@hyphen_table.name}\"",
                                    "\"#{@hyphen_user.username}\".#{@subuser_table.name}"]
    end
  end
end
