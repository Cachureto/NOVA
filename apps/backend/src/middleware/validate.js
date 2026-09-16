import { badRequest } from '../utils/httpError.js';

// validate({ body: schema, query: schema, params: schema })
export const validate = (schemas) => (req, _res, next) => {
  req.valid = {};
  for (const part of ['body', 'query', 'params']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return next(badRequest('Datos inválidos', details));
    }
    req.valid[part] = result.data;
  }
  next();
};