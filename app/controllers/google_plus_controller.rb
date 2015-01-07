# encoding: UTF-8
class GooglePlusController < ApplicationController

  layout 'front_layout'

  def google_plus
    @domain = Cartodb.config[:account_host].scan(/([^:]*)(:.*)?/).first.first
    #@client_id = Cartodb.config[:google_plus]['client_id']
    #@cookie_policy = Cartodb.config[:google_plus]['cookie_policy']
    # TODO: use parameters when this is checked in staging
    @client_id = '739127875539-5uqdnrdr6n2levhtihsdgo7qolnd5is4.apps.googleusercontent.com'
    @cookie_policy = 'https://cartodb-staging.com'
    render 'google_plus'
  end
  
end
