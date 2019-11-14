require_relative '../../lib/importer/post_import_handler'

describe CartoDB::Importer2::PostImportHandler do
  describe '#general_usage' do
    it 'tests all major methods and general usage of the class' do
      handler = CartoDB::Importer2::PostImportHandler.new

      handler.send(:tasks).count.should eq 0

      handler.add_fix_geometries_task

      handler.send(:tasks).count.should eq 1
      handler.has_fix_geometries_task?.should eq true

      # Adding again should have no effect
      handler.add_fix_geometries_task

      handler.send(:tasks).count.should eq 1
      handler.has_fix_geometries_task?.should eq true

      handler.clean

      handler.send(:tasks).count.should eq 0
      handler.has_fix_geometries_task?.should eq false
    end
  end
end

