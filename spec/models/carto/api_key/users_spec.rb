require 'spec_helper_unit'
require 'helpers/database_connection_helper'
require 'support/api_key_shared_examples'

describe Carto::ApiKey do
  include CartoDB::Factories
  include DatabaseConnectionHelper
  include ApiKeySpecHelpers

  let(:carto_user) { create(:valid_user).carto_user }
  let(:sequel_user) { carto_user.sequel_user }
  let(:other_user) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }

  it_behaves_like 'API key model'
end
