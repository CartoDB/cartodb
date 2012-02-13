# coding: UTF-8

class Api::Json::QueriesController < Api::ApplicationController
  ssl_required :run
    
  def run
    # sanity check
    raise "You must indicate a sql query in the query parameter" if params[:sql].blank?

    # execute query
    query_result = current_user.run_pg_query(params[:sql])

    # log results of query
    @to_log = params[:sql]          
    Resque.enqueue(Resque::QueriesThresholdJobs, current_user.id, params[:sql], query_result[:time])
    
    # paginate if requested
    # TODO: Actually window the SQL here          
    if params[:rows_per_page] || params[:page]
      page, per_page = CartoDB::Pagination.get_page_and_per_page(params)
      query_result[:rows] = query_result[:rows][page...page+per_page]            
    end
    
    # Return to client as JSONP        
    render_jsonp(Yajl::Encoder.encode(query_result))
  rescue => e
    errors = e.is_a?(CartoDB::ErrorRunningQuery) ? [e.db_message, e.syntax_message] : [e.message]
    CartoDB::Logger.info "exception on queries#run", errors
    render_jsonp({ :errors => errors }, 400) and return
  end
end