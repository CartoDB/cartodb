require 'spec_helper'
require 'support/factories/users'
require 'helpers/named_maps_helper'

describe Carto::DataExporter do
  include CartoDB::Factories
  include NamedMapsHelper

  describe '#export_tables' do
    include_context 'user helper'

    # INFO: this needs SQL API configured for testing
    it 'exports a table in requested format' do
      table_name = 'table1'
      table = create_table(name: table_name, user_id: @user.id)
      user_table = Carto::UserTable.find_by_table_id(table.get_table_id)

      format = 'shp'

      tmp_dir = "/tmp/export_test_#{String.random(15)}"
      FileUtils.mkdir_p tmp_dir

      begin
        file = File.new(Carto::DataExporter.new.export_table(user_table, tmp_dir, format))
        file.path.should match(/.#{format}$/)
        file.size.should > 0
        file.close
      ensure
        File.delete file if file
        FileUtils.rm_rf tmp_dir
        table.destroy
      end
    end
  end
end

describe Carto::VisualizationExport do
  include Carto::ExporterConfig
  include_context 'user helper'

  def random_filename(dir, extension: 'shp')
    "#{dir}/test_#{String.random(12)}.#{extension}".downcase
  end

  def touch_random_filename(dir, extension: 'shp')
    FileUtils.touch(random_filename(dir, extension: extension)).first
  end

  let(:base_dir) { ensure_clean_folder('/tmp/exporter_test') }
  let(:visualization) { FactoryGirl.create(:carto_visualization, user_id: @user.id) }
  let(:file1) { touch_random_filename(tmp_dir(visualization, base_dir: base_dir), extension: 'shp') }
  let(:file2) { touch_random_filename(tmp_dir(visualization, base_dir: base_dir), extension: 'shp') }
  let(:data_files) { [file1, file2] }

  it 'exports a .carto file including the carto.json and the files' do
    data_exporter_mock = mock
    data_exporter_mock.expects(:export_visualization_tables).with(visualization, anything, anything).returns(data_files)
    test_json = { test: 'test' }
    export_service_mock = mock
    export_service_mock.stubs(:export_visualization_json_string).with(visualization.id, @user).returns(test_json)

    exported_file = Carto::VisualizationExport.new.export(
      visualization,
      @user,
      data_exporter: data_exporter_mock,
      visualization_export_service: export_service_mock,
      base_dir: base_dir)

    CartoDB::Importer2::Unp.new.open(exported_file) do |files|
      files.length.should eq (data_files.count + 1)
      names = files.map(&:path)
      names.count { |f| f =~ /\.carto\.json$/ }.should eq 1
      names.should include(file1.split('/').last)
      names.should include(file2.split('/').last)
    end

    [exported_file, file1, file2].map { |f| File.delete(f) if File.exists?(f) }
    visualization.destroy
  end
end
