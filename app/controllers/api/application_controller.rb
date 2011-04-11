# coding: UTF-8

class Api::ApplicationController < ApplicationController
  skip_before_filter :browser_is_html5_compliant?, :app_host_required, :verify_authenticity_token
  before_filter :api_authorization_required
end