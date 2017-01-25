def match_sql_command(sql)
  options_pattern = %q{
    (?:\s+OPTIONS\s*\((?<options>
      (?:
        \s*
        (?:\"(?:[^\"]+)\"|(?:[^\s]+))
        \s+
        (?:\'(?:[^\']*)\'|(?:[^\'].+))
      )*
      \s*
    )\))?
  }
  patterns = {
    create_server: %r{
      CREATE\s+SERVER\s+(?<server_name>[^\s]+)
      \s+
      FOREIGN\s+DATA\s+WRAPPER\s+(?<fdw_name>[^\s]+)
      #{options_pattern}
    }xi,
    create_user_mapping: %r{
      CREATE\s+USER\s+MAPPING\s+FOR\s+\"?(?<user_name>[^\s\"]+)\"?
      \s+
      SERVER\s+(?<server_name>[^\s]+)
      #{options_pattern}
    }xi,
    import_foreign_schema: %r{
      IMPORT\s+FOREIGN\s+SCHEMA\s+\"?(?<remote_schema_name>[^\s\"]+)\"?
        \s+
        FROM\s+SERVER\s+(?<server_name>[^\s]+)
        \s+
        INTO\s+\"?(?<schema_name>[^\s\"]+)\"?
        #{options_pattern}
    }xi,
    import_foreign_schema_limited: %r{
      IMPORT\s+FOREIGN\s+SCHEMA\s+\"?(?<remote_schema_name>[^\s\"]+)\"?
        \s+
        LIMIT\s+TO\s+\((?<limited_to>.+)\)
        \s+
        FROM\s+SERVER\s+(?<server_name>[^\s]+)
        \s+
        INTO\s+\"?(?<schema_name>[^\s\"]+)\"?
        #{options_pattern}
    }xi,
    create_foreign_table: %r{
      CREATE\+FOREIGN\+TABLE\s+(?<table_name>.+)\s*\((?<columns>.+)\)
      \s+
      SERVER\s+(?<server_name>[^\s]+)
      #{options_pattern}
    }xi,
    grant_select: %r{
      GRANT\s+SELECT\s+ON\s+(?<table_name>[^\s]+)\s+TO\s+\"?(?<user_name>[^\s\"]+)\"?
    }xi,
    create_table_as_select: %r{
      CREATE\s+TABLE\s+(?<table_name>[^\s]+)\s+AS\s+SELECT\s+(?<select>.+)(?:\s+LIMIT\s+(?<limit>\d+))?
    }xi,
    drop_foreign_table_if_exists: %r{
      DROP\s+FOREIGN\s+TABLE\s+IF\s+EXISTS\s+(?<table_name>[^\s]+)(?:\s+(?<cascade>CASCADE))?
    }xi,
    drop_server_if_exists: %r{
      DROP\s+SERVER\s+IF\s+EXISTS\s+(?<server_name>[^\s]+)(?:\s+(?<cascade>CASCADE))?
    }xi,
    drop_usermapping_if_exists: %r{
      DROP\s+USER\s+MAPPING\s+IF\s+EXISTS\s+FOR\s+\"?(?<user_name>[^\s\"]+)\"?\s+SERVER\s+(?<server_name>[^\s]+)
    }xi,
    rename_foreign_table: %r{
      ALTER\s+FOREIGN\s+TABLE\s+(?<table_name>.+)\s+RENAME\s+TO\s+(?<new_name>.+)
    }xi,
    select_all: %r{
      SELECT\s+\*\s+FROM\s+(?<from>.+)
    }xi
  }
  option_pair = %r{
    \A\s*
    (?:\"(?<quoted_name>[^\"]+)\"|(?<name>[^\s]+))
    \s+
    (?:\'(?<quoted_value>[^\']*)\'|(?<value>[^\'].+))
  }x

  result = nil
  patterns.each do |command, regexp|
    match = regexp.match(sql)
    if match
      result = {
        command: command
      }
      match.names.each do |name|
        value = match[name]
        if value
          if name.in? ['options', 'columns']
            value = Hash[
              value.split(',').map { |opt|
                match = opt.match(option_pair)
                [match[:name] || match[:quoted_name], match[:value] || match[:quoted_value]] if match
              }.compact
            ]
          end
          result[name.to_sym] = value
        end
      end
      break
    end
  end

  result
end

def match_sql(sql)
  sql.scan(/(?:'[^']*'|[^;])+/).map { |command| match_sql_command(command) }.compact
end

def expect_sql(sql, expectactions = [])
  match_sql(sql).zip(expectactions).each do |parsed_sql, sql_expectactions|
    sql_expectactions.each do |key, expected_value|
      if expected_value.nil?
        parsed_sql[key].should be_nil, "#{key.inspect} wasn't expected in SQL"
      else
        parsed_sql[key].should_not be_nil, "#{key.inspect} was expected in SQL"
        if expected_value.is_a?(Regexp)
          parsed_sql[key].should match expected_value
        else
          parsed_sql[key].should eq expected_value
        end
      end
    end
  end
end
