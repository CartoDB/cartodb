# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../lib/importer/downloader'

include CartoDB::Importer2

describe Downloader do
  before do
    @file_url =
      "https://developer.mozilla.org/samples/video/chroma-key/foo.png" 
    @fusion_tables_url =
      "https://www.google.com/fusiontables/exporttable" +
      "?query=select+*+from+1dimNIKKwROG1yTvJ6JlMm4-B4LxMs2YbncM4p9g"
    @ftp_url =
      "ftp://ftp.nlm.nih.gov/nlmdata/sample/INDEX"
    @repository_dir = '/tmp/importer'
    @repository     = DataRepository::Filesystem::Local.new(@repository_dir)
  end

  after do
    FileUtils.rm_rf @repository_dir
  end

  #response = Typhoeus::Response.new(code: 200, body: "{'name' : 'paul'}")
  #Typhoeus.stub('www.example.com').and_return(response)
  #Typhoeus.get("www.example.com") == response
  #=> true
  #The queued request will hit the stub. You can also specify a regex to match
  #urls.
  #response = Typhoeus::Response.new(code: 200, body: "{'name' : 'paul'}")
  #Typhoeus.stub(/example/).and_return(response)
  #Typhoeus.get("www.example.com") == response

  describe '#run' do
    it 'downloads a file from a url' do
      downloader = Downloader.new(@file_url, nil, @repository)
      downloader.run
      File.exists?(downloader.source_file.fullpath).must_equal true
    end

    it 'extracts the source_file name from the URL' do
      downloader = Downloader.new(@file_url)
      downloader.run
      downloader.source_file.name.must_equal 'foo'
    end

    it 'extracts the source_file name from Content-Disposition header' do
      downloader = Downloader.new(@fusion_tables_url)

      downloader.run
      downloader.source_file.name.must_equal 'dec_2012_modis_forest_change'
    end
    
    it 'supports FTP urls' do
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
end # Downloader

