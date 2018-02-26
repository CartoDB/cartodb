# encoding: utf-8
require_relative '../../../../spec/spec_helper_min'
require_relative '../../lib/importer/downloader'
require_relative '../../../../lib/carto/url_validator'
require_relative '../../../../spec/helpers/file_server_helper'

include CartoDB::Importer2
include FileServerHelper

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
  end

  before(:all) { @user = FactoryGirl.create(:carto_user) }
  after(:all)  { @user.destroy }

  describe '#run' do
    it 'downloads a file from a url' do
      stub_download(url: @file_url, filepath: @file_filepath)

      downloader = Downloader.new(@user.id, @file_url)
      downloader.run
      File.exists?(downloader.source_file.fullpath).should eq true
    end

    it 'extracts the source_file name from the URL' do
      stub_download(url: @file_url, filepath: @file_filepath, content_disposition: false)

      downloader = Downloader.new(@user.id, @file_url)
      downloader.run
      downloader.source_file.name.should eq 'ne_110m_lakes'
    end

    it 'extracts the source_file name from the URL for S3 actual paths' do
      url = 'http://s3.amazonaws.com/com.cartodb.imports.staging/XXXXXXXXXXXXXXXXXXXX/ne_110m_lakes.csv' +
            '?AWSAccessKeyId=XXXXXXXXXXXXXXXXXXXX&Expires=1461934764&Signature=XXXXXXXXXXXXXXXXXXXXXXXXXXM%3D'
      stub_download(url: url, filepath: @file_filepath, content_disposition: false)

      downloader = Downloader.new(@user.id, url)
      downloader.run
      downloader.source_file.name.should eq 'ne_110m_lakes'
    end

    it 'extracts the source_file name from the URL for S3 paths without extra parameters' do
      url = "http://s3.amazonaws.com/com.cartodb.imports.staging/XXXXXXXXXXXXXXXXXXXX/ne_110m_lakes.csv"
      stub_download(url: url, filepath: @file_filepath, content_disposition: false)

      downloader = Downloader.new(@user.id, url)
      downloader.run
      downloader.source_file.name.should eq 'ne_110m_lakes'
    end

    it 'uses Content-Type header for files without extension' do
      stub_download(url: @file_url_without_extension, filepath: @file_filepath_without_extension, headers: { 'Content-Type' => 'text/csv' })
      downloader = Downloader.new(@user.id, @file_url_without_extension)
      downloader.run
      downloader.source_file.filename.should eq 'foowithoutextension.csv'
    end

    it 'uses file name for file without extension and with unknown Content-Type header' do
      stub_download(
          url: @file_url_without_extension,
          filepath: @file_filepath_without_extension,
          headers: { 'Content-Type' => 'application/octet-stream' }
      )
      downloader = Downloader.new(@user.id, @file_url_without_extension)
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
      downloader = Downloader.new(@user.id, url_csv_with_extension)
      downloader.run
      downloader.source_file.filename.should eq 'ngos.csv'
    end

    it 'ignores extra type parameters in Content-Type header' do
      stub_download(url: @file_url_without_extension, filepath: @file_filepath_without_extension, headers: { 'Content-Type' => 'vnd.ms-excel;charset=UTF-8' })
      downloader = Downloader.new(@user.id, @file_url_without_extension)
      downloader.run
      downloader.send(:content_type).should eq 'vnd.ms-excel'
    end

    it 'uses Content-Type header extension for files with different extension' do
      stub_download(
          url: @file_url_with_wrong_extension,
          filepath: @file_filepath_with_wrong_extension,
          headers: { 'Content-Type' => 'text/csv' }
      )
      downloader = Downloader.new(@user.id, @file_url_with_wrong_extension)
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
      downloader = Downloader.new(@user.id, url_tgz_without_extension)
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
      downloader = Downloader.new(@user.id, url_tgz_without_extension)
      downloader.run
      downloader.source_file.filename.should eq 'ok_data.csv.gz'
    end

    it 'uses the geojson extension if the header is text/plain' do
      url_geojson = "http://www.example.com/tm_world_borders_simpl_0_8.geojson"
      filepath_geojson  = path_to('tm_world_borders_simpl_0_8.geojson')
      stub_download(
          url: url_geojson,
          filepath: filepath_geojson,
          headers: { 'Content-Type' => 'text/plain' }
      )
      downloader = Downloader.new(@user.id, url_geojson)
      downloader.run
      downloader.source_file.filename.should eq 'tm_world_borders_simpl_0_8.geojson'
    end

    it 'uses the kml extension if the header is text/plain' do
      url_kml = "http://www.example.com/abandoned.kml"
      filepath_kml  = path_to('abandoned.kml')
      stub_download(
          url: url_kml,
          filepath: filepath_kml,
          headers: { 'Content-Type' => 'text/plain' }
      )
      downloader = Downloader.new(@user.id, url_kml)
      downloader.run
      downloader.source_file.filename.should eq 'abandoned.kml'
    end

    it 'extracts the source_file name from Content-Disposition header' do
      stub_download(
        url: @fusion_tables_url,
        filepath: @fusion_tables_filepath
      )
      downloader = Downloader.new(@user.id, @fusion_tables_url)

      downloader.run
      downloader.source_file.name.should eq 'forest_change'
    end

    it 'supports FTP urls' do
      stub_download(url: @ftp_url, filepath: @ftp_filepath)

      downloader = Downloader.new(@user.id, @ftp_url)
      downloader.run
      downloader.source_file.name.should eq 'INDEX'
    end

    it 'supports accented URLs' do
      CartoDB::Importer2::Downloader.any_instance.stubs(:validate_url!).returns(true)

      [
        { url: 'spec/fixtures/política_agraria_común.csv', name: 'política_agraria_común' },
        { url: 'spec/fixtures/many_characters_áÁñÑçÇàÀ.csv', name: 'many_characters_áÁñÑçÇàÀ' }
      ].each do |url_and_name|
        serve_file url_and_name[:url] do |url|
          downloader = Downloader.new(@user.id, url)
          downloader.run
          downloader.source_file.name.should eq url_and_name[:name]
        end
      end
    end

    it 'does not break urls with % on it' do
      # INFO: notice this URL is fake
      url_with_percentage = 'https://s3.amazonaws.com/com.cartodb.imports.staging/03b0c2199fc814ceeb75/a_file.zip?AWSAccessKeyId=AKIAIUI5FFFJIRAMEEMA&Expires=1433349484&Signature=t6m%2Bji%2BlKsnrOVqPsptXajPiozw%3D'
      downloader = Downloader.new(@user.id, url_with_percentage)
      downloader.instance_variable_get("@translated_url").should == url_with_percentage
    end

    it 'does not break local filenames with special characters on it' do
      # INFO: notice this URL is fake
      path_with_percentage = '/public/uploads/tést file%.csv'
      downloader = Downloader.new(@user.id, path_with_percentage)
      downloader.instance_variable_get("@translated_url").should == path_with_percentage
    end

    it "doesn't download the file if ETag hasn't changed" do
      etag = 'bogus'
      stub_download(
        url:      @file_url,
        filepath: @file_filepath,
        headers:  { "ETag" => etag }
      )

      downloader = Downloader.new(@user.id, @file_url, etag: etag)
      downloader.run
      downloader.modified?.should be_false
    end

    it "raises if remote URL doesn't respond with a 2XX code" do
      stub_failed_download(
        url:       @file_url,
        filepath: @file_filepath,
        headers:  {}
      )

      downloader = Downloader.new(@user.id, @file_url)
      lambda { downloader.run }.should raise_error DownloadError
    end

    it "raises if download fails with partial file error" do
      stub_download(
        url:      @file_url,
        filepath: @file_filepath,
        headers:  {}
      )

      Typhoeus::Response.any_instance.stubs(:mock).returns(false)
      Typhoeus::Response.any_instance.stubs(:return_code).returns(:partial_file)

      downloader = Downloader.new(@user.id, @file_url)
      lambda { downloader.run }.should raise_error PartialDownloadError
    end

    describe '#etag' do
      it "reads etag from download" do
        etag = 'whatever'
        stub_download(
          url:      @file_url,
          filepath: @file_filepath,
          headers:  { "ETag" => etag }
        )

        downloader = Downloader.new(@user.id, @file_url)
        downloader.etag.should eq etag
      end
    end

    describe('#quota_checks') do
      before(:all) do
        @old_max_import_file_size = @user.max_import_file_size
        @user.max_import_file_size = 1024
        @user.save
      end

      after(:all) do
        @user.max_import_file_size = @old_max_import_file_size
        @user.save
      end

      it 'raises when file size is bigger than available quota before download' do
        CartoDB::Importer2::Downloader.any_instance.stubs(:validate_url!).returns(true)
        serve_file 'spec/support/data/ne_110m_lakes.zip' do |url|
          downloader = Downloader.new(@user.id, url)
          expect { downloader.run }.to raise_error(CartoDB::Importer2::StorageQuotaExceededError)
        end
      end

      it 'raises when file size is bigger than available quota during download' do
        CartoDB::Importer2::Downloader.any_instance.stubs(:validate_url!).returns(true)

        # We stub the `content_length` so to simulate a situation where we can't infer the
        # file size from the headers, and we're forced to do it counting chunk sizes during
        # download time.
        CartoDB::Importer2::Downloader.any_instance.stubs(:content_length)

        serve_file 'spec/support/data/ne_110m_lakes.zip' do |url|
          downloader = Downloader.new(@user.id, url)
          expect { downloader.run }.to raise_error(CartoDB::Importer2::FileTooBigError)
        end
      end
    end
  end

  describe '#source_file' do
    it 'returns nil if no download initiated' do
      downloader = Downloader.new(@user.id, @file_url)
      downloader.source_file.should_not be
    end

    it 'returns a source file based on the path if passed a file path' do
      downloader = Downloader.new(@user.id, '/foo/bar')
      downloader.run
      downloader.source_file.fullpath.should eq '/foo/bar'
    end

    it 'returns a source_file name' do
      CartoDB::Importer2::Downloader.any_instance.stubs(:validate_url!).returns(true)
      serve_file 'spec/support/data/ne_110m_lakes.zip' do |url|
        downloader = Downloader.new(@user.id, url)
        downloader.run
        downloader.source_file.name.should eq 'ne_110m_lakes'
      end
    end

    it 'returns a local filepath' do
      CartoDB::Importer2::Downloader.any_instance.stubs(:validate_url!).returns(true)
      serve_file 'spec/support/data/ne_110m_lakes.zip' do |url|
        downloader = Downloader.new(@user.id, url)
        downloader.run
        downloader.source_file.fullpath.should match /#{@file_url.split('/').last}/
      end
    end
  end

  describe '#name inference' do
    it 'gets the file name from the Content-Disposition header if present' do
      headers = { "Content-Disposition" => %{attachment; filename="bar.csv"} }
      downloader = Downloader.new(@user.id, @file_url, headers)
      downloader.send(:set_headers, headers)
      downloader.instance_variable_get(:@filename).should eq 'bar.csv'

      headers = { "Content-Disposition" => %{attachment; filename=bar.csv} }
      downloader = Downloader.new(@user.id, @file_url, headers)
      downloader.send(:set_headers, headers)
      downloader.instance_variable_get(:@filename).should eq 'bar.csv'

      disposition = "attachment; filename=map_gaudi3d.geojson; " +
                    'modification-date="Tue, 06 Aug 2013 15:05:35 GMT'
      headers = { "Content-Disposition" => disposition }
      downloader = Downloader.new(@user.id, @file_url, headers)
      downloader.send(:set_headers, headers)
      downloader.instance_variable_get(:@filename).should eq 'map_gaudi3d.geojson'
    end

    it 'gets the file name from the URL if no Content-Disposition header' do
      downloader = Downloader.new(@user.id, @file_url)

      downloader.send(:set_headers, Hash.new)
      downloader.instance_variable_get(:@filename).should eq 'ne_110m_lakes.zip'
    end

    it 'gets the file name from the URL if no Content-Disposition header and custom params schema is used' do
      hard_url = "https://manolo.escobar.es/param&myfilenameparam&zip_file.csv.zip&otherinfo"

      downloader = Downloader.new(@user.id, hard_url)
      downloader.send(:set_headers, Hash.new)
      downloader.instance_variable_get(:@filename).should eq 'zip_file.csv.zip'
    end

    it 'uses random name in no name can be found in url or http headers' do
      empty_url = "https://manolo.escobar.es/param&myfilenameparam&nothing&otherinfo"

      downloader = Downloader.new(@user.id, empty_url)
      downloader.send(:set_headers, Hash.new)
      downloader.instance_variable_get(:@filename).should_not eq nil
    end

    it 'discards url query params' do
      downloader = Downloader.new(@user.id, "#{@file_url}?foo=bar&woo=wee")
      downloader.send(:set_headers, Hash.new)
      downloader.instance_variable_get(:@filename).should eq 'ne_110m_lakes.zip'
    end

    it 'matches longer extension available from filename' do
      hard_url = "https://cartofante.net/my_file.xlsx"

      downloader = Downloader.new(@user.id, hard_url)
      downloader.send(:set_headers, Hash.new)
      downloader.instance_variable_get(:@filename).should eq 'my_file.xlsx'
    end
  end

  def path_to(filename)
    File.join(File.dirname(__FILE__), '..', 'fixtures', filename)
  end
end
