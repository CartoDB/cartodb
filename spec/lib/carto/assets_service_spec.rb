require 'spec_helper_min'

describe Carto::AssetsService do
  describe('#fetch_file') do
    it 'reject files that are too big' do
      max_size = Carto::AssetsService.new.max_size_in_bytes
      IO.stubs(:copy_stream).returns(max_size + 1)

      expect {
        Carto::AssetsService.new.fetch_file(Tempfile.new(['manolo', '.png']))
      }.to raise_error(Carto::UnprocesableEntityError, "resource is too big (> #{max_size} bytes)")
    end

    it 'validates file dimensions' do
      file = File.new(Rails.root + 'spec/support/data/images/1025x1.jpg')
      expect {
        Carto::AssetsService.new.fetch_file(file)
      }.to raise_error(Carto::UnprocesableEntityError, "file is too big, 1024x1024 max")
    end

    it 'keeps original extension' do
      file = Tempfile.new(['test', '.svg'])
      file.write('wadus')
      file.rewind
      uploaded_file = Rack::Test::UploadedFile.new(file)

      temp_file = Carto::AssetsService.new.fetch_file(uploaded_file)
      temp_file.path.should end_with '.svg'
    end

    it 'rejects invalid extensions' do
      file = Tempfile.new(['test', '.exe'])
      file.write('wadus')
      file.rewind
      uploaded_file = Rack::Test::UploadedFile.new(file)

      expect {
        Carto::AssetsService.new.fetch_file(uploaded_file)
      }.to raise_error(Carto::UnprocesableEntityError, "extension not accepted")
    end
  end
end
