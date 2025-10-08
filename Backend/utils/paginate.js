/**
 * @param {Object} req - Express request object
 * @returns {Object} - { page, limit, skip }
 */
function getPagination(req) {
  let { page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page <= 0) page = 1;
  if (isNaN(limit) || limit <= 0) limit = 10;

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

module.exports = getPagination;