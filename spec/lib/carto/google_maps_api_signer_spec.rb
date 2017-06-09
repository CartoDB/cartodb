# encoding: utf-8

require_relative '../../spec_helper_min.rb'
require 'carto/google_maps_api_signer'

module Carto
  describe GoogleMapsApiSigner do
    it 'signs google maps urls' do
      gmas = GoogleMapsApiSigner.new('MjM0MzJk-3N_czQzJmFkc2Rhc2Q=')
      expect(gmas.sign('https://maps.googleapis.com/maps/api/staticmap?center=40.714%2c-73.998&zoom=12&size=400x400&key=wadus')).to eq 'https://maps.googleapis.com/maps/api/staticmap?center=40.714%2c-73.998&zoom=12&size=400x400&key=wadus&signature=Z7NEIja_cCwV7xtNpbXo7l_wrv0='
    end
  end
end
