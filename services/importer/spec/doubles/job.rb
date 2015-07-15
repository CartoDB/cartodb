# encoding: utf-8

module CartoDB
  module Importer2
    module Doubles
      class Job
        attr_accessor :db
        def initialize(db=nil, *args);
          @log = '';
          self.db = (!db.nil?) ? db : Object.new
        end
        def logger(*args);        @log; end
        def log(message);         @log << message; end
        def filepath;             ''; end
        def name;                 ''; end
        def table_name;           ''; end
        def qualified_table_name; ''; end
        def id;                   0; end
        def pg_options
          {
            host:     '',
            user:     '',
            password: '',
            database: '' 
          }
        end #pg_options

        alias_method :concealed_pg_options, :pg_options
      end # Job
    end # Doubles
  end # Importer2
end # CartoDB

