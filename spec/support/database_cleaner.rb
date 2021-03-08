##
# WARNING: the usage of this helper produces some weird hangups in PG12 builds.
# Use with caution until its integration is more spreaded
shared_context 'with DatabaseCleaner' do
  around do |example|
    DatabaseCleaner[:active_record].strategy = [:truncation, { only: %w(
      rate_limits
      account_types
      feature_flags_users
      feature_flags
      client_applications
      oauth_tokens
      search_tweets
    ) }]
    DatabaseCleaner.start

    example.run

    DatabaseCleaner.clean
    DatabaseCleaner[:active_record].strategy = nil
  end
end
