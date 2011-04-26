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
    if params[:sql].blank?
      Rails.logger.info "============== exception on queries#run ======================"
      Rails.logger.info "You must indicate a sql query (query parameter is nil or blank)"
      Rails.logger.info "=============================================================="
      render :json => { :errors => ["You must indicate a sql query"] }.to_json, :status => 400,
             :callback => params[:callback] and return
    end
    respond_to do |format|
      format.json do
        @to_log = params[:sql]
        render :json => Yajl::Encoder.encode(current_user.run_query(params[:sql])), :callback => params[:callback]
      end
    end
  rescue CartoDB::ErrorRunningQuery => e
    Rails.logger.info "============== exception on queries#run ====================="
    Rails.logger.info $!
    Rails.logger.info "============================================================="
    render :json => { :errors => [e.db_message, e.syntax_message] }.to_json, :status => 400,
           :callback => params[:callback]
  rescue
    Rails.logger.info "============== exception on queries#run ====================="
    Rails.logger.info $!
    Rails.logger.info "============================================================="
    render :json => { :errors => [$!] }.to_json, :status => 400,
          :callback => params[:callback]  
  end

end