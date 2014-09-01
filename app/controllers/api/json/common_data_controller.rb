# encoding: utf-8

require 'typhoeus'

class Api::Json::CommonDataController < Api::ApplicationController
  ssl_required :index

  def index
    if (Cartodb.config[:common_data].present? && Cartodb.config[:common_data]['username'] && Cartodb.config[:common_data]['api_key'])
      # Get all tables from the desired account in development
      # Only public in production
      privacy = Rails.env.development? ? '' : '&privacy=public'
      url = "https://#{Cartodb.config[:common_data]['username']}.cartodb.com/api/v1/viz?page=1&per_page=500#{privacy}&type=table&api_key=#{Cartodb.config[:common_data]['api_key']}"
      response = Typhoeus.get(url, followlocation: true)
      raise URI::InvalidURIError unless [200, 201].include?(response.code)
      render_jsonp(response.response_body)
    else 
      render_jsonp({ visualizations: [], total_entries: 0 });
    end
  end

end

