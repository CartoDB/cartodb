# encoding: utf-8

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
      definition_location = "#{Rails.root}/lib/formats/legends/definitions/bubble.json"
      Carto::Definition.instance
                       .load_from_file(definition_location)
    end

    describe '#bubble' do
      let(:definition) do
        {
          color: '#fff'
        }
      end

      it 'accepts a correct definition' do
        validator = LegendDefinitionValidator.new(:bubble, definition)
        validator.errors.should be_empty
      end

      it 'rejects spammy definitions' do
        spammed_definition = definition.merge(spam: 'the ham')

        validator = LegendDefinitionValidator.new(:bubble, spammed_definition)

        validator.errors.should_not be_empty
        joint_errors = validator.errors.join(', ')
        joint_errors.should include('additional properties')
      end

      it 'rejects incomplete definitions' do
        incomplete_definition = definition.except(:color)

        validator = LegendDefinitionValidator.new(:bubble, incomplete_definition)

        validator.errors.should_not be_empty
        joint_errors = validator.errors.join(', ')
        joint_errors.should include('did not contain a required property')
      end

      it 'rejects wrongly formatted colors' do
        definition[:color] = '#notcool'

        validator = LegendDefinitionValidator.new(:bubble, definition)

        validator.errors.should_not be_empty
        joint_errors = validator.errors.join(', ')
        joint_errors.should include('did not match the regex')
      end
    end

    describe '#choropleth' do
      let(:definition) do
        {
          prefix: "123",
          suffix: "foo"
        }
      end

      it 'accepts a correct definition' do
        validator = LegendDefinitionValidator.new(:choropleth, definition)
        validator.errors.should be_empty
      end

      it 'rejects spammy definitions' do
        spammed_definition = definition.merge(spam: 'the ham')

        validator = LegendDefinitionValidator.new(:choropleth,
                                                  spammed_definition)

        validator.errors.should_not be_empty
        joint_errors = validator.errors.join(', ')
        joint_errors.should include('additional properties')
      end

      it 'doesn\'t reject incomplete definitions' do
        incomplete_definition = definition.except(:prefix)

        validator = LegendDefinitionValidator.new(:choropleth,
                                                  incomplete_definition)

        validator.errors.should be_empty
      end
    end

    describe '#custom' do
      let(:definition) do
        {
          categories: [
            { title: 'Manolo Escobar' },
            { title: 'Manolo Escobar', color: '#fff' },
            { title: 'Manolo Escobar', icon: 'super.png' },
            { title: 'Manolo Escobar', icon: 'super.png', color: '#fff' }
          ]
        }
      end

      it 'accepts a correct definition' do
        validator = LegendDefinitionValidator.new(:custom, definition)
        validator.errors.should be_empty
      end

      it 'rejects spammy definitions' do
        spammed_definition = definition.merge(spam: 'the ham')

        validator = LegendDefinitionValidator.new(:custom,
                                                  spammed_definition)

        validator.errors.should_not be_empty
        joint_errors = validator.errors.join(', ')
        joint_errors.should include('additional properties')
      end

      it 'rejects incomplete definitions' do
        incomplete_definition = definition.except(:categories)

        validator = LegendDefinitionValidator.new(:custom,
                                                  incomplete_definition)

        validator.errors.should_not be_empty
        joint_errors = validator.errors.join(', ')
        joint_errors.should include('did not contain a required property')
      end

      describe 'categories' do
        it 'rejects spammy definitions' do
          definition[:categories] << { title: 'foo', spam: 'the ham' }

          validator = LegendDefinitionValidator.new(:custom, definition)

          validator.errors.should_not be_empty
          joint_errors = validator.errors.join(', ')
          joint_errors.should include('additional properties')
        end

        it 'rejects incomplete definitions' do
          definition[:categories] << {}

          validator = LegendDefinitionValidator.new(:custom, definition)

          validator.errors.should_not be_empty
          joint_errors = validator.errors.join(', ')
          joint_errors.should include('did not contain a required property')
        end

        it 'rejects wrongly formatted colors' do
          definition[:categories] << { color: '#notcool' }

          validator = LegendDefinitionValidator.new(:custom, definition)

          validator.errors.should_not be_empty
          joint_errors = validator.errors.join(', ')
          joint_errors.should include('did not match the regex')
        end
      end
    end

    describe '#category' do
      let(:definition) do
        {}
      end

      it 'accepts a correct definition' do
        validator = LegendDefinitionValidator.new(:category, definition)
        validator.errors.should be_empty
      end

      it 'rejects spammy definitions' do
        spammed_definition = definition.merge(spam: 'the ham')

        validator = LegendDefinitionValidator.new(:category, spammed_definition)

        validator.errors.should_not be_empty
        joint_errors = validator.errors.join(', ')
        joint_errors.should include('additional properties')
      end
    end

    describe '#errors' do
      it 'handles non defined schemas' do
        validator = LegendDefinitionValidator.new(nil, random_definition)

        validator.errors.should eq ['could not be validated']
      end

      it 'handles invalid definitions' do
        validator = LegendDefinitionValidator.new(:bubble, nil)

        validator.errors.should eq ['could not be validated']
      end

      it 'performs validations' do
        validator = LegendDefinitionValidator
                    .new(:bubble, random_definition)

        validation_errors = validator.errors
        validation_errors.should_not be_empty
        validation_errors.should_not include('could not be validated')
      end

      it 'is memoized' do
        validator = LegendDefinitionValidator.new('bubble', random_definition)

        JSON::Validator.expects(:fully_validate)
                       .with(bubble_definition, random_definition)
                       .returns(['Cool validation error'])
                       .once

        2.times { validator.errors.should_not be_empty }
      end
    end

    describe '#location' do
      it 'returns nil for inexistent locations' do
        validator = LegendDefinitionValidator.new(:foo, nil)

        validator.send(:location).should be_nil
      end

      it 'returns location for existent locations' do
        validator = LegendDefinitionValidator.new(:bubble, nil)

        expected_location = "#{Rails.root}/lib/formats/legends/definitions/bubble.json"
        validator.send(:location).should eq expected_location
      end

      it 'returns location for existent locations when type is string' do
        validator = LegendDefinitionValidator.new('bubble', nil)

        expected_location = "#{Rails.root}/lib/formats/legends/definitions/bubble.json"
        validator.send(:location).should eq expected_location
      end

      it 'is memoized' do
        expected_location = "#{Rails.root}/lib/formats/legends/definitions/bubble.json"
        validator = LegendDefinitionValidator.new('bubble', nil)

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
