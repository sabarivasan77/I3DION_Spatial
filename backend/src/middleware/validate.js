import { ApiError } from '../utils/errors.js';

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return next(new ApiError(400, 'Validation failed', result.error.flatten()));
    }

    req.validated = result.data;
    next();
  };
}
