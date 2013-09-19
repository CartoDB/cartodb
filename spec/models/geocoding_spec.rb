#encoding: UTF-8

require 'spec_helper'

describe Geocoding do
  before(:all) do
    @user = create_user(geocoding_quota: 200)
  end

  describe '#setup' do
    let(:geocoding) { FactoryGirl.create(:geocoding, user: @user) }

    it 'sets default timestamps value' do
      geocoding.created_at.should_not be_nil
      geocoding.updated_at.should_not be_nil
    end

    it 'links user and geocoding' do
      geocoding.user.should eq @user
    end

    it 'initializes table geocoder' do
      geocoding.table_geocoder.should be_kind_of(CartoDB::TableGeocoder)
    end
  end

  describe '#save' do
    it 'updates updated_at' do
      geocoding = FactoryGirl.build(:geocoding, user: @user)
      expect { geocoding.save }.to change(geocoding, :updated_at)
    end
  end

  describe '#run!' do
    it 'geocodes tables' do
      fixture     = "#{Rails.root}/db/fake_data/short_clubbing.csv"
      data_import = create_import(@user, fixture)
      table       = data_import.table
      @user.in_database.fetch("select count(*) from #{table.name} where the_geom is not null").first[:count].should == 0
      geocoding = Geocoding.create(
        user: @user,
        table_name: table.name,
        formatter: 'direccion, poblacion, provincia, pais'
      )
      geocoding.run!
      @user.in_database.fetch("select count(*) from #{table.name} where the_geom is not null").first[:count].should == 0
    end
  end

  def create_import(user, file_name, name=nil)
    @data_import  = DataImport.create(
      user_id:      @user.id,
      data_source:  file_name,
      table_name:   name
    )
    @data_import.send(:new_importer, file_name)
    @data_import
  end

end
