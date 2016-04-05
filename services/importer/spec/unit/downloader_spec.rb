# encoding: utf-8
require_relative '../../lib/importer/downloader'
require_relative '../../../../lib/carto/url_validator'

include CartoDB::Importer2

describe Downloader do
  before do
    @file_url =
      "http://www.naturalearthdata.com/http//www.naturalearthdata.com/download/110m/physical/ne_110m_lakes.zip"
    @file_filepath = path_to('ne_110m_lakes.zip')
    @file_url_without_extension = "http://www.example.com/foowithoutextension"
    @file_filepath_without_extension  = path_to('foowithoutextension')
    @file_url_with_wrong_extension = "http://www.example.com/csvwithwrongextension.xml"
    @file_filepath_with_wrong_extension  = path_to('csvwithwrongextension.xml')
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

      downloader = Downloader.new(@file_url, {}, {}, nil, @repository)
      downloader.run
      File.exists?(downloader.source_file.fullpath).should eq true
    end

    it 'extracts the source_file name from the URL' do
      stub_download(url: @file_url, filepath: @file_filepath)

      downloader = Downloader.new(@file_url)
      downloader.run
      downloader.source_file.name.should eq 'ne_110m_lakes'
    end

    it 'uses Content-Type header for files without extension' do
      stub_download(url: @file_url_without_extension, filepath: @file_filepath_without_extension, headers: { 'Content-Type' => 'text/csv' })
      downloader = Downloader.new(@file_url_without_extension)
      downloader.run
      downloader.source_file.filename.should eq 'foowithoutextension.csv'
    end

    it 'uses file name for file without extension and with unknown Content-Type header' do
      stub_download(
          url: @file_url_without_extension,
          filepath: @file_filepath_without_extension,
          headers: { 'Content-Type' => 'application/octet-stream' }
      )
      downloader = Downloader.new(@file_url_without_extension)
      downloader.run
      downloader.source_file.filename.should eq 'foowithoutextension'
    end

    it 'uses file name for file with extension and with unknown Content-Type header' do
      url_csv_with_extension = "http://www.example.com/ngos.csv"
      csv_filepath_with_extension  = path_to('ngos.csv')
      stub_download(
          url: url_csv_with_extension,
          filepath: csv_filepath_with_extension,
          headers: { 'Content-Type' => 'application/octet-stream' }
      )
      downloader = Downloader.new(url_csv_with_extension)
      downloader.run
      downloader.source_file.filename.should eq 'ngos.csv'
    end

    it 'ignores extra type parameters in Content-Type header' do
      stub_download(url: @file_url_without_extension, filepath: @file_filepath_without_extension, headers: { 'Content-Type' => 'vnd.ms-excel;charset=UTF-8' })
      downloader = Downloader.new(@file_url_without_extension)
      downloader.run
      downloader.send(:content_type).should eq 'vnd.ms-excel'
    end

    it 'uses Content-Type header extension for files with different extension' do
      stub_download(
          url: @file_url_with_wrong_extension,
          filepath: @file_filepath_with_wrong_extension,
          headers: { 'Content-Type' => 'text/csv' }
      )
      downloader = Downloader.new(@file_url_with_wrong_extension)
      downloader.run
      downloader.source_file.filename.should eq 'csvwithwrongextension.csv'
    end

    it 'sets the right file extension for file without extension in a multi extension Content-Type' do
      url_tgz_without_extension = "http://www.example.com/csvwithwrongextension.xml"
      tgz_filepath_without_extension  = path_to('csvwithwrongextension.xml')
      stub_download(
          url: url_tgz_without_extension,
          filepath: tgz_filepath_without_extension,
          headers: { 'Content-Type' => 'text/csv' }
      )
      downloader = Downloader.new(url_tgz_without_extension)
      downloader.run
      downloader.source_file.filename.should eq 'csvwithwrongextension.csv'
    end

    it 'uses the right file extension based in a multiple file extension Content-Type scenario' do
      url_tgz_without_extension = "http://www.example.com/ok_data.csv.gz"
      tgz_filepath_without_extension  = path_to('ok_data.csv.gz')
      stub_download(
          url: url_tgz_without_extension,
          filepath: tgz_filepath_without_extension,
          headers: { 'Content-Type' => 'application/x-gzip' }
      )
      downloader = Downloader.new(url_tgz_without_extension)
      downloader.run
      downloader.source_file.filename.should eq 'ok_data.csv.gz'
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

    it 'supports accented URLs' do
      [
        { url: 'https://raw.githubusercontent.com/CartoDB/cartodb/master/services/importer/spec/fixtures/política_agraria_común.csv', name: 'política_agraria_común'},
        # TODO: move to master branch
        { url: 'https://raw.githubusercontent.com/CartoDB/cartodb/master/services/importer/spec/fixtures/many_characters_áÁñÑçÇàÀ.csv', name: 'many_characters_áÁñÑçÇàÀ'}
      ].each { |url_and_name|
        downloader = Downloader.new(url_and_name[:url])
        downloader.run
        downloader.source_file.name.should eq(url_and_name[:name]), "Error downloading #{url_and_name[:url]}, name: #{downloader.source_file.name}"
      }

    end

    it 'does not break urls with % on it' do
      # INFO: notice this URL is fake
      url_with_percentage = 'https://s3.amazonaws.com/com.cartodb.imports.staging/03b0c2199fc814ceeb75/a_file.zip?AWSAccessKeyId=AKIAIUI5FFFJIRAMEEMA&Expires=1433349484&Signature=t6m%2Bji%2BlKsnrOVqPsptXajPiozw%3D'
      downloader = Downloader.new(url_with_percentage)
      downloader.instance_variable_get("@translated_url").should == url_with_percentage
    end

    it "doesn't download the file if ETag hasn't changed" do
      etag = 'bogus'
      stub_download(
        url:      @file_url,
        filepath: @file_filepath,
        headers:  { "ETag" => etag }
      )

      downloader = Downloader.new(@file_url, {etag: etag})
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
      downloader.source_file.name.should eq 'ne_110m_lakes'
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
      downloader.send(:name_from, headers, @file_url).should eq 'ne_110m_lakes.zip'
    end

    it 'gets the file name from the URL if no Content-Disposition header and custom params schema is used' do
      headers = {}
      hard_url = "https://manolo.escobar.es/param&myfilenameparam&zip_file.csv.zip&otherinfo"

      downloader = Downloader.new(hard_url)
      downloader.send(:name_from, headers, hard_url).should eq 'zip_file.csv.zip'
    end

    it 'uses random name in no name can be found in url or http headers' do
      headers = {}
      empty_url = "https://manolo.escobar.es/param&myfilenameparam&nothing&otherinfo"

      downloader = Downloader.new(empty_url)
      downloader.send(:name_from, headers, empty_url).should_not eq nil
    end

    it 'discards url query params' do
      headers = {}
      downloader = Downloader.new(@file_url)
      downloader.send(:name_from, headers, "#{@file_url}?foo=bar&woo=wee")
        .should eq 'ne_110m_lakes.zip'
    end

    it 'matches longer extension available from filename' do
      headers = {}
      hard_url = "https://cartofante.net/my_file.xlsx"

      downloader = Downloader.new(hard_url)
      downloader.send(:name_from, headers, hard_url).should eq 'my_file.xlsx'
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

