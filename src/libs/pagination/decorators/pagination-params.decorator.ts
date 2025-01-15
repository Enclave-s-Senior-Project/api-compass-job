import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DefaultPagination } from '../interfaces';

/**
 * Decorator intended for building a PaginationRequest object based on the query string parameters
 */
export const PaginationParams = createParamDecorator(
  (
    data: DefaultPagination = {
      defaultSkip: 0,
      defaultPage: 0,
      defaultLimit: 10,
      defaultOrder: {},
      defaultOrderDirection: 'ASC',
      maxAllowedSize: 20,
    },
    ctx: ExecutionContext,
  ) => {
    const {
      query: {
        skip: querySkip,
        page: queryPage,
        limit: queryLimit,
        orderBy,
        orderDirection,
        ...params
      },
    } = ctx.switchToHttp().getRequest();

    const {
      defaultSkip,
      defaultPage,
      defaultLimit,
      defaultOrder,
      defaultOrderDirection,
      maxAllowedSize,
    } = data;

    const order = orderBy
      ? { [orderBy]: orderDirection || defaultOrderDirection }
      : defaultOrder;

    const limit =
      queryLimit && +queryLimit > 0
        ? Math.min(+queryLimit, maxAllowedSize)
        : defaultLimit;

    let skip = querySkip ? +querySkip : undefined;
    let page = queryPage ? +queryPage : undefined;

    if (!skip) {
      if (page) {
        skip = (page - 1) * limit;
        skip = Math.max(skip, 0);
      } else {
        page = defaultPage;
        skip = defaultSkip;
      }
    } else {
      page = Math.floor(skip / limit);
    }

    return {
      ...data,
      skip,
      page,
      limit,
      order,
      params,
    };
  },
);
