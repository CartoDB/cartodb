require 'spec_helper_min'

describe Carto::AssetsService do
  describe('#fetch_file') do
    it 'reject files that are too big' do
      max_size = Carto::AssetsService.instance.max_size_in_bytes
      IO.stubs(:copy_stream).returns(max_size + 1)

      expect {
        Carto::AssetsService.instance.fetch_file(Tempfile.new('manolo'))
      }.to raise_error(Carto::UnprocesableEntityError)
    end
  end
end
