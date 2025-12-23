import { PAGINATION } from '../config/constants.js';

/**
 * Parse pagination parameters from request query
 */
export const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT),
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

/**
 * Parse sort parameters from request query
 */
export const parseSort = (query, defaultSort = '-createdAt') => {
  const sortField = query.sortBy || defaultSort.replace(/^-/, '');
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  
  // Handle default sort direction
  if (!query.sortBy && defaultSort.startsWith('-')) {
    return { [sortField]: -1 };
  }

  return { [sortField]: sortOrder };
};

/**
 * Build pagination metadata
 */
export const buildPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: page < totalPages ? page + 1 : null,
    prevPage: page > 1 ? page - 1 : null
  };
};

/**
 * Mongoose pagination helper
 */
export const paginateQuery = async (model, query = {}, options = {}) => {
  const { page, limit, skip } = parsePagination(options);
  const sort = parseSort(options, options.defaultSort);
  const select = options.select || '';
  const populate = options.populate || '';

  const [data, total] = await Promise.all([
    model.find(query)
      .select(select)
      .populate(populate)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    model.countDocuments(query)
  ]);

  return {
    data,
    pagination: buildPaginationMeta(total, page, limit)
  };
};

/**
 * Aggregate pagination helper
 */
export const paginateAggregate = async (model, pipeline = [], options = {}) => {
  const { page, limit, skip } = parsePagination(options);

  // Add count stage
  const countPipeline = [...pipeline, { $count: 'total' }];
  
  // Add pagination stages
  const dataPipeline = [
    ...pipeline,
    { $skip: skip },
    { $limit: limit }
  ];

  const [dataResult, countResult] = await Promise.all([
    model.aggregate(dataPipeline),
    model.aggregate(countPipeline)
  ]);

  const total = countResult[0]?.total || 0;

  return {
    data: dataResult,
    pagination: buildPaginationMeta(total, page, limit)
  };
};

export default {
  parsePagination,
  parseSort,
  buildPaginationMeta,
  paginateQuery,
  paginateAggregate
};
