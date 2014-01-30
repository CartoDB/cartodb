# encoding: utf-8

require_relative '../../lib/named_maps_wrapper'
require_relative '../spec_helper'

include CartoDB::NamedMapsWrapper
include CartoDB::NamedMapsWrapperSpecs

describe TemplateCreationValidator do
  
  describe '#valid_template' do
    it 'tests validation with a correct template' do
      template = { 
        :version   => '1', 
        :name      => 'somename',
        :auth      => { 
          :method  => 'open' 
        },
        :placeholders  => {},
        :layergroup    => {
          :version   => '1',
          :layers    => []
        },
        # should simply get ignored without errors
        :redundant_key => 'redundant_value'
      }
      empty_template = {}

      validator = TemplateCreationValidator.new()

      result, errors = validator.validate(template)
      result.should eq true
      errors.should eq empty_template
    end
  end #valid_template

  describe '#invalid_templates' do
    it 'tests validation with different incorrect templates' do
      wrong_template_1 = { 'something' => 'somevalue' }
      wrong_template_1_error_expectation = {
        :version       => 'key missing', 
        :name          => 'key missing', 
        :auth          => 'key missing', 
        :placeholders  => 'key missing', 
        :layergroup    => 'key missing'
      }

      wrong_template_2 = { 
        :version => '1', 
        :name    => 'somename',
        :auth    => { 
        },
        :placeholders  => {},
        :layergroup    => {
          :version     => '1',
          :layers      => []
        },
        # should simply get ignored without errors
        :redundant_key => 'redundant_value'
      }
      wrong_template_2_error_expectation = {
        :method  => 'auth subkey missing', 
      }

      wrong_template_3 = { 
        :version   => '1', 
        :name      => 'somename',
        :auth      => { 
          :method  => 'open' 
        },
        :placeholders  => {},
        :layergroup    => {
        }
      }
      wrong_template_3_error_expectation = {
        :version   => 'layergroup subkey missing', 
        :layers    => 'layergroup subkey missing'
      }

      validator = TemplateCreationValidator.new()

      result, errors = validator.validate(wrong_template_1)
      result.should eq false
      errors.should eq wrong_template_1_error_expectation

      result, errors = validator.validate(wrong_template_2)
      result.should eq false
      errors.should eq wrong_template_2_error_expectation

      result, errors = validator.validate(wrong_template_3)
      result.should eq false
      errors.should eq wrong_template_3_error_expectation
    end
  end #invalid_templates

end #NamedMap