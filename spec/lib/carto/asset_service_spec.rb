require 'helpers/storage_helper'
require 'spec_helper_min'

describe Carto::AssetService do
  include StorageHelper

  before(:each) do
    bypass_storage
  end

  describe('#fetch_file') do
    it 'reject files that are too big' do
      max_size = Carto::AssetService.instance.max_size_in_bytes
      IO.stubs(:copy_stream).returns(max_size + 1)

      expect {
        Carto::AssetService.instance.fetch_file(Tempfile.new('manolo'))
      }.to raise_error(Carto::UnprocesableEntityError)
    end
  end
end
