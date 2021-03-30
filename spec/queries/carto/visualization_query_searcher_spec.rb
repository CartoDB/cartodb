require 'spec_helper_unit'

describe Carto::VisualizationQuerySearcher do
  let(:user) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
  let(:query) { Carto::Visualization.all.select('visualizations.*').where(user_id: user.id) }
  let(:searcher) { described_class.new(query) }

  before do
    create(
      :derived_visualization,
      user_id: user.id,
      name: 'New York polution',
      description: 'Polution by traffic and industry'
    )
    Delorean.jump(1.day)
    create(
      :derived_visualization,
      user_id: user.id,
      name: 'New industries in York',
      tags: ['traffic']
    )
    Delorean.jump(1.day)
    create(:derived_visualization, user_id: user.id, name: 'Madrid traffic and polution')
    Delorean.back_to_the_present
  end

  context 'word search' do
    it 'retuns an empty result if the word is not present' do
      result = searcher.search('car')

      expect(result.size).to eql 0
    end

    it 'finds words in title, description and tag' do
      result = searcher.search('traffic')

      expect(result.size).to eql 3
    end

    it 'finds singular and plural words with a singular one' do
      result = searcher.search('industry')

      expect(result.size).to eql 2
    end

    it 'finds singular and plural words with a plural one' do
      result = searcher.search('industries')

      expect(result.size).to eql 2
    end

    it 'allows to search with several words not consecutive' do
      result = searcher.search('New York traffic')

      expect(result.size).to eql 2
    end
  end

  context 'partial search' do
    it 'retuns an empty result if the text is not present' do
      result = searcher.search('x')

      expect(result.size).to eql 0
    end

    it 'finds partial text in title, tags and description' do
      result = searcher.search('ff')

      expect(result.size).to eql 3
    end
  end

  context 'ordering' do
    it 'ranks matches by type: title > tag > description' do
      result = searcher.search('traffic')

      expect(result.size).to eql 3
      expect(result.first.name).to eql 'Madrid traffic and polution'
      expect(result.second.name).to eql 'New industries in York'
      expect(result.third.name).to eql 'New York polution'
    end

    it 'ranks better matches with word repetition' do
      result = searcher.search('polution')

      expect(result.size).to eql 2
      expect(result.first.name).to eql 'New York polution'
      expect(result.second.name).to eql 'Madrid traffic and polution'
    end

    it 'ranks better matches with close together words' do
      result = searcher.search('New York')

      expect(result.size).to eql 2
      expect(result.first.name).to eql 'New York polution'
      expect(result.second.name).to eql 'New industries in York'
    end

    it 'orders by updated_at when the rank is the same (like in partial search)' do
      result = searcher.search('o')

      expect(result.size).to eql 3
      expect(result.first.name).to eql 'Madrid traffic and polution'
      expect(result.second.name).to eql 'New industries in York'
    end
  end

end
