import { createParamDecorator, ExecutionContext } from '@nestjs/common';
// import { UserEntity } from '@admin/access/users/user.entity';

// export const CurrentUser = createParamDecorator<UserEntity>((data: unknown, ctx: ExecutionContext) => {
//   const request = ctx.switchToHttp().getRequest();
//   return request.user;
// });

export const CurrentUser = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    console.log('Extracting user from request', request.user);
    return request.user;
});
