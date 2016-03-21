require_relative '../../spec/doubles/batch_sql_api'
require_relative '../../spec/doubles/user'

shared_context "batch_sql_api" do
  include_context "cdb_importer schema"
  before(:each) do
    @user = create_user({
      username: 'admin',
      api_key: 'dummy_key'
    })
    @log = CartoDB::Importer2::Doubles::Log.new(@user)
    mock = CartoDB::Importer2::Doubles::BatchSQLApi.new(@user, @db)
    CartoDB::Importer2::BatchApiQuery.stubs(:new).returns(mock)
  end

  after(:each) do
    @user.destroy
  end
end
