# coding: UTF-8

class Api::Json::QueriesController < Api::ApplicationController
  ssl_required :run
    
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
        query_result = current_user.run_query(params[:sql])
        Resque.enqueue(Resque::QueriesThresholdJobs, current_user.id, params[:sql], query_result[:time])
        if params[:rows_per_page].nil? && params[:page].nil?
          render :json => Yajl::Encoder.encode(query_result), :callback => params[:callback]
        else
          page, per_page = CartoDB::Pagination.get_page_and_per_page(params)
          query_result[:rows] = query_result[:rows][page...page+per_page]
          render :json => Yajl::Encoder.encode(query_result), :callback => params[:callback]
        end
      end
    end
  rescue CartoDB::ErrorRunningQuery => e
    Rails.logger.info "============== exception on queries#run ====================="
    Rails.logger.info $!
    Rails.logger.info "============================================================="
    render :json => { :errors => [e.db_message, e.syntax_message] }.to_json, :status => 400,
           :callback => params[:callback]
  rescue CartoDB::TableNotExists => e
    Rails.logger.info "============== exception on queries#run ====================="
    Rails.logger.info e.message
    Rails.logger.info "============================================================="
    render :json => { :errors => [e.message] }.to_json, :status => 400,
          :callback => params[:callback]  
  rescue 
    Rails.logger.info "============== exception on queries#run ====================="
    Rails.logger.info $!
    Rails.logger.info "============================================================="
    render :json => { :errors => [$!] }.to_json, :status => 400,
          :callback => params[:callback]  
  end

end