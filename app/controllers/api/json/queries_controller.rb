# coding: UTF-8

class Api::Json::QueriesController < Api::ApplicationController
  ssl_required :run
  
  # Run a query against your database
  # * Request Method: +GET+
  # * URI: +/v1+
  # * Params:
  #   * +sql+: the query to be executed
  # * Format: +JSON+
  # * Response:
  #     {
  #       "total_rows" => 100,
  #       "rows" => [{:id=>1, :name=>"name 1", :location=>"...", :description=>"description 1"}]
  #     }
  def run
    respond_to do |format|
      format.json do
        render :json => current_user.run_query(params[:sql]).to_json, :callback => params[:callback]
      end
    end
  rescue CartoDB::ErrorRunningQuery => e
    render :json => { :errors => [e.db_message, e.syntax_message] }.to_json, :status => 400,
           :callback => params[:callback]
  end

end