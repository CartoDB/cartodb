# encoding: utf-8

require_relative '../../spec_helper_min'

describe Carto::VisualizationQueryOrderer do
  before(:all) do
    @user = FactoryGirl.create(:carto_user)
    table = FactoryGirl.create(:table, user_id: @user.id)
    table.insert_row!(name: 'name1')
    table.update_table_pg_stats
    @visualization_a = FactoryGirl.create(:derived_visualization, user_id: @user.id, name: 'Visualization A',
                                                                  map_id: table.map_id)
    Delorean.jump(1.day)
    @visualization_b = FactoryGirl.create(:derived_visualization, user_id: @user.id, name: 'Visualization B')
    @visualization_b.add_like_from(@user.id)
    Delorean.back_to_the_present

    query = Carto::Visualization.all.select("visualizations.*").where(user_id: @user.id, type: 'derived')
    @orderer = Carto::VisualizationQueryOrderer.new(query: query, user_id: @user.id)
  end

  after(:all) do
    Carto::Visualization.all.each(&:destroy)
    @user.destroy
  end

  it 'orders ascending by default' do
    result = @orderer.order('name')

    expect(result.size).to eql 2
    expect(result.first.name).to eql @visualization_a.name
  end

  context 'by name' do
    it 'orders ascending' do
      result = @orderer.order('name', 'asc')

      expect(result.size).to eql 2
      expect(result.first.name).to eql @visualization_a.name
    end

    it 'orders descending' do
      result = @orderer.order('name', 'desc')

      expect(result.size).to eql 2
      expect(result.first.name).to eql @visualization_b.name
    end
  end

  context 'by updated_at' do
    it 'orders ascending' do
      result = @orderer.order('updated_at', 'asc')

      expect(result.size).to eql 2
      expect(result.first.name).to eql @visualization_a.name
    end

    it 'orders descending' do
      result = @orderer.order('updated_at', 'desc')

      expect(result.size).to eql 2
      expect(result.first.name).to eql @visualization_b.name
    end
  end

  context 'by favorited' do
    it 'orders ascending' do
      result = @orderer.order('favorited', 'asc')

      expect(result.size).to eql 2
      expect(result.first.name).to eql @visualization_a.name
    end

    it 'orders descending' do
      result = @orderer.order('favorited', 'desc')

      expect(result.size).to eql 2
      expect(result.first.name).to eql @visualization_b.name
    end
  end

  context 'by likes' do
    it 'orders ascending' do
      result = @orderer.order('likes', 'asc')

      expect(result.size).to eql 2
      expect(result.first.name).to eql @visualization_a.name
    end

    it 'orders descending' do
      result = @orderer.order('likes', 'desc')

      expect(result.size).to eql 2
      expect(result.first.name).to eql @visualization_b.name
    end
  end

  context 'by privacy' do
    before(:each) do
      link_privacy = Carto::Visualization::PRIVACY_LINK
      @visualization_c = FactoryGirl.create(:derived_visualization, user_id: @user.id, privacy: link_privacy).store
    end

    after(:each) do
      @visualization_c.delete
    end

    it 'orders ascending' do
      result = @orderer.order('privacy', 'asc')

      expect(result.size).to eql 3
      expect(result.first.privacy).to eql Carto::Visualization::PRIVACY_LINK
    end

    it 'orders descending' do
      result = @orderer.order('privacy', 'desc')

      expect(result.size).to eql 3
      expect(result.first.privacy).to eql Carto::Visualization::PRIVACY_PUBLIC
    end
  end

  context 'by estimated row count' do
    it 'orders ascending' do
      result = @orderer.order('estimated_row_count', 'asc')

      expect(result.size).to eql 2
      expect(result.first.name).to eql @visualization_b.name
    end

    it 'orders descending' do
      result = @orderer.order('estimated_row_count', 'desc')

      expect(result.size).to eql 2
      expect(result.first.name).to eql @visualization_a.name
    end
  end

  context 'by size' do
    it 'orders ascending' do
      p Carto::Visualization.all.first.size
      p Carto::Visualization.all.last.size

      result = @orderer.order('size', 'asc')

      expect(result.size).to eql 2
      expect(result.first.name).to eql @visualization_b.name
    end

    it 'orders descending' do
      result = @orderer.order('size', 'desc')

      expect(result.size).to eql 2
      expect(result.first.name).to eql @visualization_a.name
    end
  end  

  context 'multiple ordering' do
    before(:each) do
      Delorean.jump(2.days)
      @visualization_c = FactoryGirl.create(:derived_visualization, user_id: @user.id, name: 'Visualization C')
      @visualization_c.add_like_from(@user.id)
      Delorean.back_to_the_present
    end

    after(:each) do
      @visualization_c.delete
    end    

    it 'orders by favorited desc + updated_at desc' do
      result = @orderer.order('favorited,updated_at', 'desc,desc')

      expect(result.size).to eql 3
      expect(result.first.name).to eql @visualization_c.name
      expect(result.second.name).to eql @visualization_b.name
    end

    it 'orders by favorited desc + updated_at asc' do
      result = @orderer.order('favorited,updated_at', 'desc,asc')

      expect(result.size).to eql 3
      expect(result.first.name).to eql @visualization_b.name
      expect(result.second.name).to eql @visualization_c.name
    end

    it 'orders by favorited desc + name with default direction (asc)' do
      result = @orderer.order('favorited,name', 'desc')

      expect(result.size).to eql 3
      expect(result.first.name).to eql @visualization_b.name
      expect(result.second.name).to eql @visualization_c.name
    end    
  end
end
