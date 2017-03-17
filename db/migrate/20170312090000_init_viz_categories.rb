Sequel.migration do
  change do
    execute "DELETE FROM visualization_categories;"
    execute "ALTER SEQUENCE visualization_categories_id_seq RESTART;"
    execute "UPDATE visualization_categories SET id=DEFAULT;"

    execute "INSERT INTO visualization_categories (type, name, parent_id, list_order) VALUES
      (1, 'Datasets', 0, 0),
      (2, 'Maps', 0, 1);"

    execute "INSERT INTO visualization_categories (type, name, parent_id, list_order) VALUES    
      (1, 'Energy', 1, 0),
      (1, 'Vessels', 1, 0),
      (1, 'Environmental', 1, 0),
      (1, 'Real Estate', 1, 0),
      (1, 'Banking', 1, 0),
      (1, 'Demographics', 1, 0),
      (1, 'Economics', 1, 0),
      (1, 'Retail', 1, 0),
      (1, 'Points of Interest', 1, 0),
      (1, 'Administrative', 1, 0),
      (1, 'Political', 1, 0),
      (1, 'Transportation', 1, 0);"

    execute "INSERT INTO visualization_categories (type, name, parent_id, list_order) VALUES    
      (1, 'Exploration', 3, 0),
      (1, 'Renewables', 3, 0),
      (1, 'Coal', 3, 0),
      (1, 'Natural Gas', 3, 0),
      (1, 'Oil', 3, 0),
      (1, 'Regions', 3, 0),
      (1, 'Agriculture', 3, 0),
      (1, 'Power', 3, 0),
      (1, 'Metals', 3, 0);"

    execute "INSERT INTO visualization_categories (type, name, parent_id, list_order) VALUES    
      (1, 'Natural Disasters', 5, 0),
      (1, 'Climate', 5, 0),
      (1, 'Weather', 5, 0);"

    execute "INSERT INTO visualization_categories (type, name, parent_id, list_order) VALUES    
      (1, 'Global', 12, 0),
      (1, 'Australia', 12, 0),
      (1, 'Asia', 12, 0),
      (1, 'South America', 12, 0),
      (1, 'Europe', 12, 0),
      (1, 'North America', 12, 0);"
  end
end