require_relative '../../spec_helper_min'

describe Carto::VisualizationQueryOrderer do
  before(:all) do
    @user = FactoryGirl.create(:carto_user)
    @visualization_a = FactoryGirl.create(:carto_visualization, user_id: @user.id, name: 'Visualization A',
                                                                  privacy: Carto::Visualization::PRIVACY_PUBLIC)
    Delorean.jump(1.day)
    @visualization_b = FactoryGirl.create(:carto_visualization, user_id: @user.id, name: 'Visualization B',
                                                                  privacy: Carto::Visualization::PRIVACY_LINK)
    @visualization_b.add_like_from(@user)
    Delorean.back_to_the_present

    query = Carto::Visualization.all.select("visualizations.*").where(user_id: @user.id)
    @orderer = Carto::VisualizationQueryOrderer.new(query)
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
    it 'orders ascending' do
      result = @orderer.order('privacy', 'asc')

      expect(result.size).to eql 2
      expect(result.first.name).to eql @visualization_b.name
    end

    it 'orders descending' do
      result = @orderer.order('privacy', 'desc')

      expect(result.size).to eql 2
      expect(result.first.name).to eql @visualization_a.name
    end
  end

  context 'multiple ordering' do
    before(:each) do
      Delorean.jump(2.days)
      @visualization_c = FactoryGirl.create(:derived_visualization, user_id: @user.id, name: 'Visualization C',
                                                                    privacy: Carto::Visualization::PRIVACY_LINK)
      Delorean.back_to_the_present
    end

    after(:each) do
      @visualization_c.delete
    end

    it 'orders by privacy desc + updated_at desc' do
      result = @orderer.order('privacy,updated_at', 'desc,desc')

      expect(result.size).to eql 3
      expect(result.first.name).to eql @visualization_a.name
      expect(result.second.name).to eql @visualization_c.name
    end

    it 'orders by privacy desc + updated_at asc' do
      result = @orderer.order('privacy,updated_at', 'desc,asc')

      expect(result.size).to eql 3
      expect(result.first.name).to eql @visualization_a.name
      expect(result.second.name).to eql @visualization_b.name
    end

    it 'orders by privacy + name without direction (default direction = asc)' do
      result = @orderer.order('privacy,name')

      expect(result.size).to eql 3
      expect(result.first.name).to eql @visualization_b.name
      expect(result.second.name).to eql @visualization_c.name
    end

    it 'orders by privacy desc + name without direction (it takes the first direction)' do
      result = @orderer.order('privacy,name', 'desc')

      expect(result.size).to eql 3
      expect(result.first.name).to eql @visualization_a.name
      expect(result.second.name).to eql @visualization_c.name
    end
  end
end
