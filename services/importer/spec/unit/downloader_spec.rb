# encoding: utf-8
require_relative '../../lib/importer/downloader'

include CartoDB::Importer2

describe Downloader do
  before do
    @file_url =
      "https://developer.mozilla.org/samples/video/chroma-key/foo.png" 
    @file_filepath  = path_to('foo.png')
    @file_url_without_extension = "http://www.example.com/foowithoutextension"
    @file_filepath_without_extension  = path_to('foowithoutextension')
    @fusion_tables_url =
      "https://www.google.com/fusiontables/exporttable" +
      "?query=select+*+from+1dimNIKKwROG1yTvJ6JlMm4-B4LxMs2YbncM4p9g"
    @fusion_tables_filepath = path_to('forest_change.csv')
    @ftp_url        = "ftp://ftp.nlm.nih.gov/nlmdata/sample/INDEX"
    @ftp_filepath   = path_to('INDEX.txt')
    @repository_dir = '/tmp/importer'
    @repository     = DataRepository::Filesystem::Local.new(@repository_dir)
    @repository.create_base_directory
  end

  after(:each) do
    Typhoeus::Expectation.clear
  end

  after do
    FileUtils.rm_rf @repository_dir
  end

  describe '#run' do
    it 'downloads a file from a url' do
      stub_download(url: @file_url, filepath: @file_filepath) 

      downloader = Downloader.new(@file_url, {}, nil, @repository)
      downloader.run
      File.exists?(downloader.source_file.fullpath).should eq true
    end

    it 'extracts the source_file name from the URL' do
      stub_download(url: @file_url, filepath: @file_filepath) 

      downloader = Downloader.new(@file_url)
      downloader.run
      downloader.source_file.name.should eq 'foo'
    end

    it 'uses Content-Type header for files without extension' do
      stub_download(url: @file_url_without_extension, filepath: @file_filepath_without_extension, headers: { 'Content-Type' => 'text/csv' })
      downloader = Downloader.new(@file_url_without_extension)
      downloader.run
      downloader.source_file.filename.should eq 'foowithoutextension.csv'
    end

    it 'extracts the source_file name from Content-Disposition header' do
      stub_download(
        url: @fusion_tables_url,
        filepath: @fusion_tables_filepath
      )
      downloader = Downloader.new(@fusion_tables_url)

      downloader.run
      downloader.source_file.name.should eq 'forest_change'
    end
    
    it 'supports FTP urls' do
      stub_download(url: @ftp_url, filepath: @ftp_filepath) 

      downloader = Downloader.new(@ftp_url)
      downloader.run
      downloader.source_file.name.should eq 'INDEX'
    end

    xit 'supports accented URLs' do
      # TODO: change this request to master
      accented_url = 'https://raw.githubusercontent.com/CartoDB/cartodb/3315-Uploading_of_files_with_accents_on_the_filename_dont_work/services/importer/spec/fixtures/política_agraria_común.csv'
      downloader = Downloader.new(accented_url)
      downloader.run
      downloader.source_file.name.should eq 'política_agraria_común'
    end

    it "doesn't download the file if ETag hasn't changed" do
      etag = 'bogus'
      stub_download(
        url:      @file_url,
        filepath: @file_filepath,
        headers:  { "ETag" => etag }
      )

      downloader = Downloader.new(@file_url, etag: etag)
      downloader.run
      downloader.modified?.should eq false
    end

    it "raises if remote URL doesn't respond with a 2XX code" do
      stub_failed_download(
        url:       @file_url,
        filepath: @file_filepath,
        headers:  {}
      )
      
      downloader = Downloader.new(@file_url)
      lambda { downloader.run }.should raise_error DownloadError
    end
  end

  describe '#source_file' do
    it 'returns nil if no download initiated' do
      downloader = Downloader.new(@file_url)
      downloader.source_file.should_not be
    end

    it 'returns a source file based on the path if passed a file path' do
      downloader = Downloader.new('/foo/bar')
      downloader.run
      downloader.source_file.fullpath.should eq '/foo/bar'
    end

    it 'returns a source_file name' do
      downloader = Downloader.new(@file_url)
      downloader.run
      downloader.source_file.name.should eq 'foo'
    end

    it 'returns a local filepath' do
      downloader = Downloader.new(@file_url)
      downloader.run
      downloader.source_file.fullpath.should match /#{@file_url.split('/').last}/
    end
  end #source_file

  describe '#name_from' do
    it 'gets the file name from the Content-Disposition header if present' do
      headers = { "Content-Disposition" => %{attachment; filename="bar.csv"} }
      downloader = Downloader.new(@file_url)
      downloader.send(:name_from, headers, @file_url).should eq 'bar.csv'

      headers = { "Content-Disposition" => %{attachment; filename=bar.csv} }
      downloader = Downloader.new(@file_url)
      downloader.send(:name_from, headers, @file_url).should eq 'bar.csv'

      disposition = "attachment; filename=map_gaudi3d.geojson; " + 
                    'modification-date="Tue, 06 Aug 2013 15:05:35 GMT'
      headers = { "Content-Disposition" => disposition }
      downloader = Downloader.new(@file_url)
      downloader.send(:name_from, headers, @file_url).should eq 'map_gaudi3d.geojson'
    end

    it 'gets the file name from the URL if no Content-Disposition header' do
      headers = {}
      downloader = Downloader.new(@file_url)
      downloader.send(:name_from, headers, @file_url).should eq 'foo.png'
    end

    it 'discards url query params' do
      headers = {}
      downloader = Downloader.new(@file_url)
      downloader.send(:name_from, headers, "#{@file_url}?foo=bar&woo=wee")
        .should eq 'foo.png'
    end
  end #name_from

  def stub_download(options)
    url       = options.fetch(:url)
    filepath  = options.fetch(:filepath)
    headers   = options.fetch(:headers, {})

    Typhoeus.stub(url).and_return(response_for(filepath, headers))
  end

  def stub_failed_download(options)
    url       = options.fetch(:url)
    filepath  = options.fetch(:filepath)
    headers   = options.fetch(:headers, {})

    Typhoeus.stub(url).and_return(failed_response_for(filepath, headers))
  end

  def response_for(filepath, headers={})
     response = Typhoeus::Response.new(
        code:     200,
        body:     File.new(filepath).read.to_s,
        headers:  headers.merge(headers_for(filepath))
     )
     response
  end #response_for

  def failed_response_for(filepath, headers={})
     Typhoeus::Response.new(code: 404, body: nil, headers: {})
  end #response_for

  def headers_for(filepath)
    filename = filepath.split('/').last
    { "Content-Disposition" => "attachment; filename=#{filename}" }
  end #headers_for

  def path_to(filename)
    File.join(File.dirname(__FILE__), '..', 'fixtures', filename)
  end
end # Downloader

