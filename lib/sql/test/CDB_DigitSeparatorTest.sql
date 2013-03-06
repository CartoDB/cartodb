CREATE TEMP TABLE "_CDB_DigitSeparatorTest" (
  none text,
  only_com_dec text,
  only_dot_dec text,
  only_com_tho text,
  only_dot_tho text,
  both_com_dec text,
  both_dot_dec text,
  "only_com_AMB" text,
  "only_dot_AMB" text
);
COPY "_CDB_DigitSeparatorTest" FROM STDIN;
123456	123,1235	123.12345	1,234,231	1.234.234	1.234,23	1,234.23	1,123	1.123
123456	123,12	123.12	231	234	1.121.234,230	3,111,234.230	123,123	123.123
123456	123,12	123.12	231	234	1.121.234,2	3,111,234.230	123,123	123.123
\.

SELECT 'none', * FROM
       CDB_DigitSeparator('"_CDB_DigitSeparatorTest"'::regclass, 'none');
SELECT 'only_com_dec', * FROM
       CDB_DigitSeparator('"_CDB_DigitSeparatorTest"'::regclass, 'only_com_dec');
SELECT 'only_dot_dec', * FROM
       CDB_DigitSeparator('"_CDB_DigitSeparatorTest"'::regclass, 'only_dot_dec');
SELECT 'only_com_tho', * FROM
       CDB_DigitSeparator('"_CDB_DigitSeparatorTest"'::regclass, 'only_com_tho');
SELECT 'only_dot_tho', * FROM
       CDB_DigitSeparator('"_CDB_DigitSeparatorTest"'::regclass, 'only_dot_tho');
SELECT 'both_com_dec', * FROM
       CDB_DigitSeparator('"_CDB_DigitSeparatorTest"'::regclass, 'both_com_dec');
SELECT 'both_dot_dec', * FROM
       CDB_DigitSeparator('"_CDB_DigitSeparatorTest"'::regclass, 'both_dot_dec');
SELECT 'only_com_AMB', * FROM
       CDB_DigitSeparator('"_CDB_DigitSeparatorTest"'::regclass, 'only_com_AMB');
SELECT 'only_dot_AMB', * FROM
       CDB_DigitSeparator('"_CDB_DigitSeparatorTest"'::regclass, 'only_dot_AMB');

DROP TABLE "_CDB_DigitSeparatorTest";

