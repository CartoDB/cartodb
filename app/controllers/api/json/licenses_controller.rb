# encoding: utf-8
require_relative '../../../models/carto/licenses'

class Api::Json::LicensesController < Api::ApplicationController
  ssl_required :index

  skip_before_filter :api_authorization_required, only: [:index]

  def index
    render_jsonp(Carto::License.all)
  end

end
