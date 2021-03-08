require 'carto/connector/provider'

class DummyConnectorProvider < Carto::Connector::Provider
  metadata id: 'dummy', name: 'Dummy'
  required_parameters %I(table req1 req2)
  optional_parameters %I(opt1 opt2)

  @copies = []
  def self.copies
    @copies
  end

  @error_message = nil
  def self.failing_with(msg)
    prev = @error_message
    @error_message = msg
    yield
    @error_message = prev
  end
  def self.error_message
    @error_message
  end

  DEFAULT_FEATURES = {
    'sql_queries': false,
    'list_databases': false,
    'list_tables': true,
    'preview_table': false,
    'dry_run': false,
    'list_projects': false
  }

  def copy_table(schema_name:, table_name:, limits: {})
    validate!
    raise self.class.error_message if self.class.error_message
    self.class.copies << [schema_name, table_name, limits]
    # We expect @user to be a ::User here (Sequel model)
    @user.in_database.run "CREATE TABLE #{schema_name}.#{table_name}()"
  end

  def check_connection
    raise self.class.error_message if self.class.error_message.present?

    true
  end

  def table_name
    @params[:table]
  end

  def remote_data_updated?
    true
  end

  def list_tables(limits: {})
    must_be_defined_in_derived_class unless features_information[:list_tables]
    [{schema:'s1', name: 't1'}, {schema:'s2', name: 't2'}]
  end

  def list_databases()
    must_be_defined_in_derived_class unless features_information[:list_databases]
    ['db1', 'db2']
  end

  def list_projects()
    must_be_defined_in_derived_class unless features_information[:list_projects]
    [{id: 'project-1', friendly_name: 'Project 1'}, {id: 'project-2', friendly_name: 'Project 2'}]
  end

  def list_project_datasets(project_id)
    must_be_defined_in_derived_class unless features_information[:list_projects]
    [{id: 'data-1', qualified_name: "#{project_id}.data-1"}, {id: 'data-2', qualified_name: "#{project_id}.data-2"}]
  end

  def list_project_dataset_tables(project_id, dataset_id)
    must_be_defined_in_derived_class unless features_information[:list_projects]
    [{id: 't-1', qualified_name: "#{project_id}.#{dataset_id}.t-1"}, {id: 't-2', qualified_name: "#{project_id}.#{dataset_id}.t-2"}]
  end

  def dry_run
    must_be_defined_in_derived_class unless features_information[:dry_run]
    raise self.class.error_message if self.class.error_message
    {dry_run_results: '...'}
  end

  def features_information
    DEFAULT_FEATURES
  end
end

class DummyConnectorProviderWithModifiedDate < DummyConnectorProvider
  metadata id: 'dummy_with_modified_date', name: 'DummyWithModifiedDate'
  @copies = []
  LAST_MODIFIED = Time.new(2020, 6, 16)
  def remote_data_updated?
    @previous_last_modified.blank? || last_modified > @previous_last_modified
  end

  def last_modified
    LAST_MODIFIED
  end
end

def dummy_connector_provider_with_id(id, name=nil, features=DummyConnectorProvider::DEFAULT_FEATURES)
  Class.new(DummyConnectorProvider) do
    metadata id: id, name: name || id
    @copies = []
    define_method(:features_information){ features }
  end
end
