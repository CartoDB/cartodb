require_relative '../../../../lib/carto/file_system/sanitize.rb'

module Carto
  module FileSystem
    module Sanitize
      describe '#sanitize_identifier' do
        it 'should allow for non ascii characters' do
          identifier = 'MæđrÏD, ĘŠPªÑÅ'

          Carto::FileSystem::Sanitize.sanitize_identifier(identifier).should eq identifier
        end

        it 'should sanitize disallowed characters' do
          identifier = "M\x00æđ/rÏD,\\:* : ! ? \" ' >Ę<ŠP|ªÑÅ"
          sanitized_identifier = 'M_æđ_rÏD,___ _ ! _ _ \' _Ę_ŠP_ªÑÅ'

          Carto::FileSystem::Sanitize.sanitize_identifier(identifier).should eq sanitized_identifier
        end
      end
    end
  end
end
