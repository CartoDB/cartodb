/**
 * Transform the data obtained from an internal formula dataview into a
 * public object.
 *
 * @param  {number} nulls
 * @param  {string} operation
 * @param  {number} result
 *
 * @return {carto.dataview.FormulaData} - The parsed and formatted data for the given parameters
 */
function parseFormulaData (nulls, operation, result) {
  /**
   * @description
   * Object containing formula data
   *
   * @typedef {object} carto.dataview.FormulaData
   * @property {number} nulls - Number of null values in the column
   * @property {string} operation - Operation used
   * @property {number} result - Result of the operation
   * @api
   */
  return {
    nulls: nulls,
    operation: operation,
    result: result
  };
}

module.exports = parseFormulaData;
