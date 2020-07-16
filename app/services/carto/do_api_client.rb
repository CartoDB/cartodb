require 'typhoeus'
module Carto
  class DoApiClient
    def initialize(user, url = nil)
      @user = user
      @url = url || default_url(user)
    end

    def dataset(dataset_id)
      response = Typhoeus::Request.new(
        "#{@url}/api/v4/data/observatory/metadata/datasets/#{dataset_id}",
        method: 'GET'
      ).run
      unless response.success?
        raise "dataset metadata response #{response.response_code} #{response.status_message}"
      end
      JSON.load response.body
    end

    private

    def default_url(user)
      Rails.env == 'production' ? "https://#{user.username}.carto.com" : "https://#{user.username}.carto-staging.com"
    end
  end
end
