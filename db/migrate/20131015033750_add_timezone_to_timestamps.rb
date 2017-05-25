Sequel.migration do

  TABLE_LIST = {
    'client_applications' => ['created_at', 'updated_at'],
    'data_imports' => ['created_at', 'updated_at'],
    'geocodings' => ['created_at', 'updated_at'],
    'layers' => ['updated_at'],
    'maps' => ['updated_at'],
    'oauth_nonces' => ['created_at', 'updated_at'],
    'oauth_tokens' => ['created_at', 'updated_at', 'authorized_at', 'invalidated_at', 'valid_to'],
    'synchronizations' => ['created_at', 'updated_at', 'run_at', 'ran_at'],
    'user_tables' => ['updated_at'],
    'users' => ['period_end_date', 'upgraded_at', 'dashboard_viewed_at'],
    'visualizations' => ['created_at', 'updated_at']
  }

  up do
    TABLE_LIST.each do |table_name,columns|
      columns.each do |column|
        SequelRails.connection.run(%Q{
          ALTER TABLE #{table_name}
          ALTER COLUMN #{column} 
          TYPE timestamptz
        })
      end
    end
  end

  down do
    TABLE_LIST.each do |table_name,columns|
      columns.each do |column|
        SequelRails.connection.run(%Q{
          ALTER TABLE #{table_name}
          ALTER COLUMN #{column} 
          TYPE timestamp
        })
      end
    end
  end
end
