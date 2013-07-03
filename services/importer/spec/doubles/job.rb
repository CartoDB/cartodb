# encoding: utf-8

module CartoDB
  module Importer2
    module Doubles
      class Job
        def initialize(*args);  @log = ''; end
        def logger(*args);      @log; end
        def log(message);       @log << message; end
        def filepath;           ''; end
        def name;               ''; end
        def table_name;         ''; end
        def id;                 0; end
        def pg_options
          {
            host:     '',
            user:     '',
            password: '',
            database: '' 
          }
        end #pg_options

      end # Job
    end # Doubles
  end # Importer2
end # CartoDB

