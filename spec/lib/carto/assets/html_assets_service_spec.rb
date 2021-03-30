require 'fileutils'
require 'spec_helper_min'
require_relative '../../../../app/controllers/carto/controller_helper'
require_relative '../../../../lib/carto/configuration'

describe Carto::HTMLAssetsService do
  after(:all) do
    FileUtils.rmtree(Carto::Conf.new.public_uploads_path + '/html_assets')
  end

  describe('#fetch_file') do

    it 'rejects files that are too big' do
      max_size = Carto::HTMLAssetsService.instance.max_size_in_bytes
      IO.stubs(:copy_stream).returns(max_size + 1)

      expect {
        Carto::HTMLAssetsService.instance.fetch_file(StringIO.new('test'))
      }.to raise_error(Carto::UnprocesableEntityError, "resource is too big (> #{max_size} bytes)")
    end

    it 'create a file has html extension' do
      temp_file = Carto::HTMLAssetsService.instance.fetch_file(StringIO.new('test'))
      temp_file.path.should end_with '.html'
    end
  end

  describe('#upload') do
    it 'uploads file and stores in the local system' do
      visualization = create(:carto_visualization)
      storage_info, url = Carto::HTMLAssetsService.instance.upload(visualization, StringIO.new('test'))
      storage_info.present?.should be true
      url.present?.should be true
    end
  end
end
