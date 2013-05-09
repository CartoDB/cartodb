# encoding: utf-8
require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../services/data-repository/repository'
require_relative '../../../app/models/visualization/collection'
require_relative '../../../app/models/visualization/member'

include CartoDB

describe Visualization::Collection do
  describe '#fetch' do
    it 'can search by tag if the backend supports array columns' do
      db            = Sequel.postgres(host: Rails.configuration.database_configuration[Rails.env]["host"], port: Rails.configuration.database_configuration[Rails.env]["port"], username: Rails.configuration.database_configuration[Rails.env]["username"])
      relation      = :"visualizations_#{Time.now.to_i}"
      create_visualizations_table_in(db, relation)

      repository    = DataRepository::Backend::Sequel.new(db, relation)

      attributes_1  = { name: 'viz 1', tags: ['tag 1', 'tag 11'] }
      attributes_2  = { name: 'viz 2', tags: ['tag 2', 'tag 22'] }
      Visualization::Member.new(attributes_1, repository).store
      Visualization::Member.new(attributes_2, repository).store
      collection    = Visualization::Collection.new({}, { repository: repository })

      collection.fetch(tags: 'tag 1').count.should == 1
      db.drop_table relation.to_sym
    end
  end

  def create_visualizations_table_in(db, relation)
    db.create_table relation do
      String    :id, primary_key: true
      String    :name
      String    :description
      Integer   :map_id, index: true
      Integer   :active_layer_id
      String    :type
      String    :privacy
    end

    db.run(%Q{
      ALTER TABLE "#{relation}"
      ADD COLUMN tags text[]
    })
  end #create_visualizations_table_in
end # Visualization::Collection

