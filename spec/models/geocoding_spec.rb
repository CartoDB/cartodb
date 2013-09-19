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
    let(:geocoding) { FactoryGirl.build(:geocoding, user: @user) }

    it 'validates table_name and formatter' do
      expect { geocoding.save }.to raise_error(Sequel::ValidationFailed)
    end

    it 'updates updated_at' do
      geocoding = FactoryGirl.build(:geocoding, user: @user, table_name: 'a', formatter: 'b')
      expect { geocoding.save }.to change(geocoding, :updated_at)
    end
  end

  describe '#run!' do
    it 'updates total_rows and processed_rows' do
      geocoding = Geocoding.create(user: @user, table_name: 'a', formatter: 'b')
      geocoding.table_geocoder.stubs(:run).returns true
      geocoding.table_geocoder.stubs(:process_results).returns true
      CartoDB::Geocoder.any_instance.stubs(:status).returns 'completed'
      CartoDB::Geocoder.any_instance.stubs(:update_status).returns true
      CartoDB::Geocoder.any_instance.stubs(:total_rows).returns 20
      CartoDB::Geocoder.any_instance.stubs(:processed_rows).returns 10

      geocoding.run!
      geocoding.total_rows.should eq 20
      geocoding.processed_rows.should eq 10
    end
  end

end
