# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../downloader'

include CartoDB::Importer

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

  describe '#run' do
    it 'downloads a file from a url' do
      downloader = Downloader.new(@file_url, nil, @repository)
      downloader.run
      File.exists?(downloader.candidate.fetch(:path)).must_equal true
    end

    it 'extracts the candidate name from the URL' do
      downloader = Downloader.new(@file_url)
      downloader.candidate.must_be_empty
      downloader.run
      downloader.candidate.fetch(:name).must_equal 'foo'
    end

    it 'extracts the candidate name from Content-Disposition header' do
      downloader = Downloader.new(@fusion_tables_url)

      downloader.candidate.must_be_empty
      downloader.run
      downloader.candidate.fetch(:name)
        .must_equal 'dec_2012_modis_forest_change'
    end
    
    it 'supports FTP urls' do
      downloader = Downloader.new(@ftp_url)
      downloader.run
      downloader.candidate.fetch(:name).must_equal 'INDEX'
    end
  end

  describe '#candidate' do
    it 'returns an empty hash if no download initiated' do
      downloader = Downloader.new(@file_url)
      downloader.candidate.must_equal({})
    end

    it 'returns a candidate name' do
      downloader = Downloader.new(@file_url)
      downloader.run
      downloader.candidate.fetch(:name).must_equal 'foo'
    end

    it 'returns a file extension' do
      downloader = Downloader.new(@file_url)
      downloader.run
      downloader.candidate.fetch(:extension).must_equal '.png'
    end

    it 'returns a local filepath' do
      seed  = Time.now.to_i

      downloader = Downloader.new(@file_url, seed)
      downloader.run
      downloader.candidate.fetch(:path).must_match /#{seed}/
    end
  end #candidate

  describe '#filename_from' do
    it 'gets the file name from the Content-Disposition header if present' do
      headers = { "Content-Disposition" => %{attachment; filename="bar.csv"} }
      downloader = Downloader.new(@file_url)
      downloader.filename_from(headers, @file_url).must_equal 'bar.csv'
    end

    it 'gets the file name from the URL if no Content-Disposition header' do
      headers = {}
      downloader = Downloader.new(@file_url)
      downloader.filename_from(headers, @file_url).must_equal 'foo.png'
    end
  end #filename_from
end # Downloader

