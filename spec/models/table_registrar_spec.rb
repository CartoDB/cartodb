require 'spec_helper_min'

describe CartoDB::TableRegistrar do
  before(:all) do
    @user = FactoryGirl.create(:carto_user)
  end

  after(:all) do
    ::User[@user.id].destroy
  end

  class TableSpy
    attr_accessor :user_id, :name, :migrate_existing_table, :data_import_id, :description, :tags

    def []=(key, value)
      attrs[key] = value
    end

    def save
      true
    end

    def optimize
      true
    end

    def set_tag_array(tags)
      self.tags = tags
    end

    private

    def attrs
      @attrs ||= {}
    end
  end

  describe '#register' do
    let(:description) { "Table registrar test description" }

    before(:each) do
      @external_data_import = FactoryGirl.create(:full_external_data_import)
      @external_data_import.external_source.visualization.description = description
      @external_data_import.external_source.visualization.save
    end

    after(:each) do
      @external_data_import.destroy
    end

    it 'registers description from external sources' do
      map_mock = mock
      map_mock.stubs(:recalculate_bounds!).returns(true)
      TableSpy.any_instance.stubs(:map).returns(map_mock)
      tr = CartoDB::TableRegistrar.new(@user, TableSpy)
      tr.register('xxx', @external_data_import.data_import_id)
      tr.table.description.should eq description
    end
  end
end
