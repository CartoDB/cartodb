require 'spec_helper'
require 'support/factories/users'
require 'helpers/named_maps_helper'

describe Carto::DataExporter do
  include CartoDB::Factories
  include NamedMapsHelper

  describe '#export_tables' do
    before(:all) do
      @user = create_user(email: 'exporter@cartotest.com', username: 'dt-test', password: '123456')
    end

    after(:all) do
      bypass_named_maps
      @user.destroy
    end

    before(:each) do
      bypass_named_maps
      delete_user_data(@user)
    end

    # TODO: Disabled because it needs SQL API configured for testing
    xit 'exports a table in requested format' do
      table_name = 'table1'
      table = create_table(name: table_name, user_id: @user.id)
      user_table = Carto::UserTable.find_by_table_id(table.get_table_id)

      format = 'shp'

      file = File.new(Carto::DataExporter.new.export_table(user_table, format))
      file.path.should match(/.#{format}$/)
      file.size.should > 0
      file.close
      File.delete file

      table.destroy
    end
  end
end

describe Carto::VisualizationExport do

end
