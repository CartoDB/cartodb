require_relative '../../spec_helper_min.rb'
require 'carto/google_maps_api'

module Carto
  describe GoogleMapsApi do
    let(:url) { 'https://maps.googleapis.com/maps/api/staticmap?center=40.714%2c-73.998&zoom=12&size=400x400' }

    describe '#sign' do
      describe 'with client_id' do
        # You can generate test signature with https://developers.google.com/maps/documentation/static-maps/get-api-key
        let(:user) do
          build(:user, google_maps_key: 'client=wds', google_maps_private_key: 'MjM0MzJk-3N_czQzJmFkc2Rhc2Q=')
        end

        it 'signs google maps urls' do
          gmas = GoogleMapsApi.new
          expect(gmas.sign_url(user, url)).to eq "#{url}&client=wds&signature=fK5mHV9MLROw4xZnBPcrCOUdjio="
        end
      end

      describe 'with api_key' do
        let(:user) do
          build(:user, google_maps_key: 'key=xxx')
        end

        it 'signs google maps urls' do
          gmas = GoogleMapsApi.new
          expect(gmas.sign_url(user, url)).to eq "#{url}&key=xxx"
        end
      end
    end
  end
end
