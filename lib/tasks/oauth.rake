require_relative '../../lib/cartodb/trending_maps'
require_relative '../../lib/static_maps_url_helper'

namespace :cartodb do
  namespace :oauth do
    desc 'Delete expired oauth access tokens'
    task destroy_expired_access_tokens: :environment do
      Carto::OauthAccessToken.expired.find_each do |token|
        begin
          token.destroy!
        rescue => e
          CartoDB::Logger.error(message: 'Could not destroy expired access token', exception: e)
        end
      end
    end
  end
end
