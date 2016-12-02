# encoding: utf-8

require_relative '../../../rspec_configuration'
require 'ostruct'
require 'uuidtools'
require_relative '../../../../app/controllers/carto/api/data_import_presenter'
require_relative '../../../spec_helper'

module CartoDB; end

describe Carto::Api::DataImportPresenter do
  before(:all) do
    @user = create_user
    @user.max_layers = 4
  end

  before(:each) do
    @data_import = OpenStruct.new(
      user: @user,
      state: 'success',
      success: true,
      created_at: Time.now,
      updated_at: Time.now,
      id: UUIDTools::UUID.timestamp_create.to_s,
      stats: '{}',
      type_guessing: false,
      quoted_fields_guessing: false,
      content_guessing: false,
      create_visualization: false,
      user_defined_limits: '{}',
      original_url: '',
      service_name: '',
      rejected_layers: 'manolo,escobar',
      runner_warnings: '{"max_tables_per_import":10}'
    )
  end

  after(:all) do
    @user.destroy
  end

  describe '#display_name' do

    it 'extracts data_source file name' do
      @data_import.data_source = 'http://www.whatever.com/wadus.csv'
      presenter = Carto::Api::DataImportPresenter.new(@data_import)
      presenter.api_public_values['display_name'].should == 'wadus.csv'
    end

    it 'extracts service_item_id file name' do
      @data_import.service_item_id = 'http://www.whatever.com/wadus.csv'
      presenter = Carto::Api::DataImportPresenter.new(@data_import)
      presenter.api_public_values['display_name'].should == 'wadus.csv'
    end

    it 'extracts categories for Twitter searches' do
      @data_import.service_name = 'twitter_search'
      @data_import.service_item_id = '{ "categories": [ { "terms": "first" } ] }'
      presenter = Carto::Api::DataImportPresenter.new(@data_import)
      presenter.api_public_values['display_name'].should == "Tweets about 'first'"
    end

    it 'extracts filenames with special characters' do
      @data_import.service_item_id = 'http://www.whatever-whatever.org/Población-2000.csv'
      presenter = Carto::Api::DataImportPresenter.new(@data_import)
      presenter.api_public_values['display_name'].force_encoding('UTF-8').should eq "Población-2000.csv"
    end

    it 'extracts malformed urls from service_item_id' do
      [
        ['/wadus wadus.csv', 'wadus wadus.csv'],
        ['/1. wadus - wadus wadus wadus/2. wadus wadus-wadus/wadus/WADUS_WADUS.xls', 'WADUS_WADUS.xls']
      ].map { |url_and_expected|
        @data_import.service_item_id = url_and_expected[0]
        presenter = Carto::Api::DataImportPresenter.new(@data_import)
        presenter.api_public_values['display_name'].should eq(url_and_expected[1]), url_and_expected
      }
    end

    it 'extracts id if neither service_item_id nor data_source given without throwing errors' do
      CartoDB.expects(:notify_debug).never
      presenter = Carto::Api::DataImportPresenter.new(@data_import)
      presenter.api_public_values['display_name'].should eq @data_import.id
    end

    it 'extracts id if empty service_item_id and data_source are given without throwing errors' do
      @data_import.service_item_id = ''
      @data_import.data_source = ''
      CartoDB.expects(:notify_debug).never
      presenter = Carto::Api::DataImportPresenter.new(@data_import)
      presenter.api_public_values['display_name'].should eq @data_import.id
    end

    it 'gets warnings' do
      CartoDB.expects(:notify_debug).never
      presenter = Carto::Api::DataImportPresenter.new(@data_import)
      expected = { :rejected_layers => ["manolo", "escobar"], :user_max_layers => 4, "max_tables_per_import" => 10 }
      presenter.api_public_values[:warnings].should eq expected
    end

    it 'shows if import is raster' do
      @data_import.send('is_raster?=', true)
      presenter = Carto::Api::DataImportPresenter.new(@data_import)
      presenter.api_public_values[:is_raster].should eq true
    end
  end
end
