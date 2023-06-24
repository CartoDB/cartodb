##
# WARNING: the usage of this helper produces some weird hangups in PG12 builds.
# Use with caution until its integration is more spreaded
shared_context 'with DatabaseCleaner' do
  after { Carto::AccountType.delete_all }
end
