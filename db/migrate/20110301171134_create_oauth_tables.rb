class CreateOauthTablesMigration < Sequel::Migration

  def up
    create_table :client_applications do
      primary_key :id
      String :name
      String :url
      String :support_url
      String :callback_url
      String :key, :limit => 40, :unique => true
      String :secret, :limit => 40
      Integer :user_id
      DateTime :created_at, :null => false
      DateTime :updated_at, :null => false
    end

    create_table :oauth_tokens do
      primary_key :id
      Integer :user_id
      String :type, :limit => 20
      Integer :client_application_id
      String :token, :limit => 40, :unique => true
      String :secret, :limit => 40
      String :callback_url
      String :verifier, :limit => 20
      String :scope
      DateTime :authorized_at
      DateTime :invalidated_at
      DateTime :valid_to
      DateTime :created_at, :null => false
      DateTime :updated_at, :null => false
    end

    create_table :oauth_nonces do
      primary_key :id
      String :nonce
      Integer :timestamp
      DateTime :created_at, :null => false
      DateTime :updated_at, :null => false
      index [:nonce, :timestamp], :unique => true
    end
  end

  def down
    drop_table :client_applications
    drop_table :oauth_tokens
    drop_table :oauth_nonces
  end

end