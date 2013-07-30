# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../lib/importer/downloader'

include CartoDB::Importer2

describe Downloader do
  before do
    @file_url =
      "https://developer.mozilla.org/samples/video/chroma-key/foo.png" 
    @file_filepath  = path_to('foo.png')
    @fusion_tables_url =
      "https://www.google.com/fusiontables/exporttable" +
      "?query=select+*+from+1dimNIKKwROG1yTvJ6JlMm4-B4LxMs2YbncM4p9g"
    @fusion_tables_filepath = path_to('forest_change.csv')
    @ftp_url        = "ftp://ftp.nlm.nih.gov/nlmdata/sample/INDEX"
    @ftp_filepath   = path_to('INDEX.txt')
    @repository_dir = '/tmp/importer'
    @repository     = DataRepository::Filesystem::Local.new(@repository_dir)
  end

  after do
    FileUtils.rm_rf @repository_dir
  end

  describe '#run' do
    it 'downloads a file from a url' do
      stub_download(url: @file_url, filepath: @file_filepath) 

      downloader = Downloader.new(@file_url, nil, @repository)
      downloader.run
      File.exists?(downloader.source_file.fullpath).must_equal true
    end

    it 'extracts the source_file name from the URL' do
      stub_download(url: @file_url, filepath: @file_filepath) 

      downloader = Downloader.new(@file_url)
      downloader.run
      downloader.source_file.name.must_equal 'foo'
    end

    it 'extracts the source_file name from Content-Disposition header' do
      skip
      stub_download(url: @fusion_tables_url, filepath: @fusion_tables_filepath)
      downloader = Downloader.new(@fusion_tables_url)

      downloader.run
      downloader.source_file.name.must_equal 'forest_change'
    end
    
    it 'supports FTP urls' do
      stub_download(url: @ftp_url, filepath: @ftp_filepath) 

      downloader = Downloader.new(@ftp_url)
      downloader.run
      downloader.source_file.name.must_equal 'INDEX'
    end
  end

  describe '#source_file' do
    it 'returns nil if no download initiated' do
      downloader = Downloader.new(@file_url)
      downloader.source_file.must_be_nil
    end

    it 'returns a source file based on the path if passed a file path' do
      downloader = Downloader.new('/foo/bar')
      downloader.run
      downloader.source_file.fullpath.must_equal '/foo/bar'
    end

    it 'returns a source_file name' do
      downloader = Downloader.new(@file_url)
      downloader.run
      downloader.source_file.name.must_equal 'foo'
    end

    it 'returns a local filepath' do
      seed  = Time.now.to_i

      downloader = Downloader.new(@file_url, seed)
      downloader.run
      downloader.source_file.fullpath.must_match /#{seed}/
    end
  end #source_file

  describe '#name_from' do
    it 'gets the file name from the Content-Disposition header if present' do
      headers = { "Content-Disposition" => %{attachment; filename="bar.csv"} }
      downloader = Downloader.new(@file_url)
      downloader.name_from(headers, @file_url).must_equal 'bar.csv'
    end

    it 'gets the file name from the URL if no Content-Disposition header' do
      headers = {}
      downloader = Downloader.new(@file_url)
      downloader.name_from(headers, @file_url).must_equal 'foo.png'
    end

    it 'discards url query params' do
      headers = {}
      downloader = Downloader.new(@file_url)
      downloader.name_from(headers, "#{@file_url}?foo=bar&woo=wee")
        .must_equal 'foo.png'
    end
  end #name_from

  def stub_download(options)
    url       = options.fetch(:url)
    filepath  = options.fetch(:filepath)

    Typhoeus.stub(url).and_return(response_for(filepath))
  end #stub_download

  def response_for(filepath)
     Typhoeus::Response.new(
        headers:  headers_for(filepath),
        code:     200,
        body:     File.new(filepath).read.to_s
     )
  end #response_for

  def headers_for(filepath)
    filename = filepath.split('/').last
    [Typhoeus::Response::Header.new(
        "Content-Disposition: attachment; filename=#{filename}"
    )]
  end #headers_for

  def path_to(filename)
    File.join(File.dirname(__FILE__), '..', 'fixtures', filename)
  end
end # Downloader

