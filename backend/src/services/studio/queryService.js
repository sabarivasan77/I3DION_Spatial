import { pool } from '../../db/pool.js';

export const queryService = {
  /**
   * Execute a structured JSON query safely with tenant isolation
   */
  executeQuery: async (queryConfig, organizationId) => {
    const {
      dataset_key = 'vault_products',
      filters = [],
      sort = [],
      search = '',
      pagination = { page: 1, limit: 25 }
    } = queryConfig || {};

    const page = Math.max(1, parseInt(pagination.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(pagination.limit || 25, 10)));
    const offset = (page - 1) * limit;

    let tableName = 'products';
    let defaultOrderField = 'created_at';

    if (dataset_key === 'vault_products') {
      tableName = 'products';
    } else if (dataset_key === 'vault_assets' || dataset_key === 'vault_documents') {
      tableName = 'vault_assets';
    } else if (dataset_key === 'vault_enquiries') {
      tableName = 'vault_enquiries';
    } else {
      tableName = 'products';
    }

    const whereClauses = [`organization_id = $1`];
    const queryParams = [organizationId];

    // Handle dataset type filter for assets/documents
    if (dataset_key === 'vault_documents') {
      queryParams.push('document');
      whereClauses.push(`file_category = $${queryParams.length}`);
    }

    // Search condition across text fields
    if (search && typeof search === 'string' && search.trim() !== '') {
      queryParams.push(`%${search.trim()}%`);
      const searchParamIdx = queryParams.length;
      if (tableName === 'products') {
        whereClauses.push(`(name ILIKE $${searchParamIdx} OR description ILIKE $${searchParamIdx} OR category ILIKE $${searchParamIdx})`);
      } else if (tableName === 'vault_enquiries') {
        whereClauses.push(`(full_name ILIKE $${searchParamIdx} OR email ILIKE $${searchParamIdx} OR company_name ILIKE $${searchParamIdx})`);
      } else {
        whereClauses.push(`(name ILIKE $${searchParamIdx} OR file_category ILIKE $${searchParamIdx})`);
      }
    }

    // Structured filter conditions
    if (Array.isArray(filters)) {
      filters.forEach((f) => {
        if (!f || !f.field) return;

        // Sanitize field name to avoid SQL injection
        const cleanField = f.field.replace(/[^a-zA-Z0-9_]/g, '');
        if (!cleanField) return;

        const op = (f.operator || 'Equals').toLowerCase();
        const val = f.value;

        if (op === 'equals' || op === '=') {
          queryParams.push(val);
          whereClauses.push(`${cleanField} = $${queryParams.length}`);
        } else if (op === 'notequals' || op === '!=') {
          queryParams.push(val);
          whereClauses.push(`${cleanField} != $${queryParams.length}`);
        } else if (op === 'contains') {
          queryParams.push(`%${val}%`);
          whereClauses.push(`${cleanField} ILIKE $${queryParams.length}`);
        } else if (op === 'startswith') {
          queryParams.push(`${val}%`);
          whereClauses.push(`${cleanField} ILIKE $${queryParams.length}`);
        } else if (op === 'endswith') {
          queryParams.push(`%${val}`);
          whereClauses.push(`${cleanField} ILIKE $${queryParams.length}`);
        } else if (op === 'greaterthan' || op === '>') {
          queryParams.push(val);
          whereClauses.push(`${cleanField} > $${queryParams.length}`);
        } else if (op === 'lessthan' || op === '<') {
          queryParams.push(val);
          whereClauses.push(`${cleanField} < $${queryParams.length}`);
        } else if (op === 'greaterorequal' || op === '>=') {
          queryParams.push(val);
          whereClauses.push(`${cleanField} >= $${queryParams.length}`);
        } else if (op === 'lessorequal' || op === '<=') {
          queryParams.push(val);
          whereClauses.push(`${cleanField} <= $${queryParams.length}`);
        } else if (op === 'isempty') {
          whereClauses.push(`(${cleanField} IS NULL OR ${cleanField}::text = '')`);
        } else if (op === 'isnotempty') {
          whereClauses.push(`(${cleanField} IS NOT NULL AND ${cleanField}::text != '')`);
        }
      });
    }

    // Build ORDER BY clause
    let orderByClause = `ORDER BY ${defaultOrderField} DESC`;
    if (Array.isArray(sort) && sort.length > 0) {
      const sortParts = sort.map((s) => {
        const cleanField = (s.field || defaultOrderField).replace(/[^a-zA-Z0-9_]/g, '');
        const dir = (s.direction || 'ASC').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        return `${cleanField} ${dir}`;
      });
      orderByClause = `ORDER BY ${sortParts.join(', ')}`;
    }

    const whereString = whereClauses.join(' AND ');

    try {
      // Total count query
      const countSql = `SELECT COUNT(*) as total FROM ${tableName} WHERE ${whereString}`;
      const countRes = await pool.query(countSql, queryParams);
      const totalRecords = parseInt(countRes.rows[0]?.total || 0, 10);

      // Paginated records query
      const limitParamIdx = queryParams.length + 1;
      const offsetParamIdx = queryParams.length + 2;
      const recordsSql = `SELECT * FROM ${tableName} WHERE ${whereString} ${orderByClause} LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`;
      const recordsRes = await pool.query(recordsSql, [...queryParams, limit, offset]);

      return {
        dataset_key,
        records: recordsRes.rows,
        pagination: {
          page,
          limit,
          total_records: totalRecords,
          total_pages: Math.ceil(totalRecords / limit) || 1
        }
      };
    } catch (err) {
      console.error('Query Execution Error:', err);
      return {
        dataset_key,
        records: [],
        pagination: { page: 1, limit, total_records: 0, total_pages: 1 },
        error: err.message
      };
    }
  }
};
