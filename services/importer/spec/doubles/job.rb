module CartoDB
  module Importer2
    module Doubles
      class Job
        attr_accessor :db, :source_file_rows, :imp, :source_file_rows, :imported_rows, :fallback_executed
        def initialize(db=nil, *args);
          @log = '';
          self.db = (!db.nil?) ? db : Object.new
        end
        def logger(*args);        @log; end
        def log(message, truncate = true); @log << message; end
        def filepath;             ''; end
        def name;                 ''; end
        def table_name;           ''; end
        def qualified_table_name; ''; end
        def id;                   0; end
        def import_error_percent;  0; end
        def rows_number;          0; end
        def schema; ''; end
        def delete_job_table;     end
        def delete_temp_table(table_name); end;
        def pg_options
          {
            host:     '',
            user:     '',
            password: '',
            database: ''
          }
        end

        alias_method :concealed_pg_options, :pg_options
      end
    end
  end
end

