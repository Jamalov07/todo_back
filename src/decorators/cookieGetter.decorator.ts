import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export const cookieGetter = createParamDecorator(
  async (data: 'refresh_token', context: ExecutionContext): Promise<string> => {
    const request = context.switchToHttp().getRequest();
    console.log(request);
    console.log(request.cookies);

    const refreshToken = request.cookies[data];
    if (!refreshToken) {
      throw new UnauthorizedException('admin unauthorized decorator');
    }
    return refreshToken;
  },
);
