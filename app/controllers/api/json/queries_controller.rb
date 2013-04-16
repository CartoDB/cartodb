# coding: UTF-8

class Api::Json::QueriesController < Api::ApplicationController
  ssl_required :run
    
  def run
    query = params[:sql]
    # Sanity check
    raise "You must indicate a sql query in the query parameter" if query.blank?
    affected_tables = CartoDB::SqlParser.new(query, connection: current_user.in_database).affected_tables
    raise "System tables are forbidden" if affected_tables.any? { |t| t =~ /[ ,"'(]*pg_.+/ }

    params[:rows_per_page] = 40 unless params[:rows_per_page].present?
    params[:page] = 0 unless params[:page].present?

    # Window SELECT queries, run the others straight ahead
    q = if /\Aselect/i.match query.strip
      page, per_page = CartoDB::Pagination.get_page_and_per_page(params)
      order_fragment = (params[:order_by].blank? ? "" : "ORDER BY #{params[:order_by]} #{(params[:mode] == 'des' ? 'DESC' : 'ASC')}")
      "SELECT * FROM (#{query.gsub(/;\s*$/, '')}) AS subq #{order_fragment} LIMIT #{per_page} OFFSET #{page}"
    else
      query
    end

    # Run query
    query_result = current_user.run_pg_query(q)
    
    if query.downcase.include? "create table "
      begin
        query.downcase.split("create table ").each do |statement|
          table_name = statement.split(/[\s\(]/).first
          if table_name
            @table = Table.new
            @table.user_id = current_user.id
            @table.migrate_existing_table = table_name
            @table.save  
          end
        end
      # or, should the process of 'creating' the table fail if we can't register the table?
      rescue => e
        errors = e.is_a?(CartoDB::ErrorRunningQuery) ? [e.db_message, e.syntax_message] : [e.message]
        CartoDB::Logger.info "exception automatically creating new cartodb table", errors
      end
    end
    if query.downcase.include? "drop table "
      begin
        #get all tables in user_tables
        #check each if exists in database
        #drop each that doesn't exist
        Table.fetch("select name,id from user_tables
                          where user_tables.user_id = ?", current_user.id).all do |row|
          if current_user.run_pg_query("SELECT relname FROM pg_class WHERE relname='#{row.name}'")[:rows].empty?
            Table.filter(:user_id => current_user.id, :id => row.id).delete
            Tag.filter(:user_id => current_user.id, :table_id => row.id).delete
          end
        end
      # or, should the process of 'creating' the table fail if we can't register the table?
      rescue => e
        errors = e.is_a?(CartoDB::ErrorRunningQuery) ? [e.db_message, e.syntax_message] : [e.message]
        CartoDB::Logger.info "exception automatically dropping cartodb table components", errors
      end
    end
    
    # log results of query
    @to_log = query
    Resque.enqueue(Resque::QueriesThresholdJobs, current_user.id, query, query_result[:time])

    # Return to client as JSONP        
    render_jsonp Yajl::Encoder.encode(query_result)
  rescue => e
    errors = e.is_a?(CartoDB::ErrorRunningQuery) ? [e.db_message, e.syntax_message] : [e.message]
    CartoDB::Logger.info "exception on queries#run", errors
    render_jsonp({ :errors => errors }, 400) and return
  end
end
