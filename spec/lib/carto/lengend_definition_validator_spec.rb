# encoding utf-8

require 'spec_helper_min'

module Carto
  describe LegendDefinitionValidator do
    let(:random_definition) do
      {
        hey: 'teacher',
        leave: {
          the: 'kids alone'
        }
      }.with_indifferent_access
    end

    let(:bubble_definition) do
      definition_location = "#{Rails.root}/lib/formats/legends/bubble.json"
      Carto::Definition.instance
                       .load_from_file(definition_location)
    end

    describe '#errors' do
      it 'handles non defined schemas' do
        validator = Carto::LegendDefinitionValidator.new(nil, random_definition)

        validator.errors.should eq ['could not be validated']
      end

      it 'handles invalid definitions' do
        validator = Carto::LegendDefinitionValidator.new(:bubble, nil)

        validator.errors.should eq ['could not be validated']
      end

      it 'performs validations' do
        validator = Carto::LegendDefinitionValidator
                    .new(:bubble, random_definition)

        validation_errors = validator.errors
        validation_errors.should_not be_empty
        validation_errors.should_not include('could not be validated')
      end

      it 'is memoized' do
        validator = Carto::LegendDefinitionValidator
                    .new('bubble', random_definition)

        JSON::Validator.expects(:fully_validate)
                       .with(bubble_definition, random_definition)
                       .returns(['Cool validation error'])
                       .once

        2.times { validator.errors.should_not be_empty }
      end
    end

    describe '#location' do
      it 'returns nil for inexistent locations' do
        validator = Carto::LegendDefinitionValidator.new(:foo, nil)

        validator.send(:location).should be_nil
      end

      it 'returns location for existent locations' do
        validator = Carto::LegendDefinitionValidator.new(:bubble, nil)

        expected_location = "#{Rails.root}/lib/formats/legends/bubble.json"
        validator.send(:location).should eq expected_location
      end

      it 'returns location for existent locations when type is string' do
        validator = Carto::LegendDefinitionValidator.new('bubble', nil)

        expected_location = "#{Rails.root}/lib/formats/legends/bubble.json"
        validator.send(:location).should eq expected_location
      end

      it 'is memoized' do
        expected_location = "#{Rails.root}/lib/formats/legends/bubble.json"
        validator = Carto::LegendDefinitionValidator.new('bubble', nil)

        File.expects(:exists?)
            .with(expected_location)
            .returns(true)
            .once

        validator.send(:location).should eq expected_location
        validator.send(:location).should eq expected_location
      end
    end
  end
end
