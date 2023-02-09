import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { cookieGetter } from '../decorators/cookieGetter.decorator';
import { CreateWorkDto } from '../works/dto/create-work.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './users.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  registration(
    @Body() userBody: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log(userBody,111111111);
    return this.userService.registration(userBody, res);
  }

  @Post('login')
  login(
    @Body() authBody: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.userService.login(authBody, res);
  }

  @Post(':id/refresh')
  refresh(
    @Param('id') id: string,
    @cookieGetter('refresh_token') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.userService.refreshToken(+id, refreshToken, res);
  }

  @Post('logout')
  logout(
    @cookieGetter('refresh_token') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.userService.logout(refreshToken, res);
  }

  @Get()
  getAll() {
    return this.userService.getUsers();
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.userService.delete(+id);
  }

  @Get('all')
  async getAllUserWorks(@cookieGetter('refresh_token') refreshToken: string) {
    return this.userService.getUserWorks(refreshToken);
  }

  @Get('work/:id')
  async getOneWork(
    @Param('id') id: number,
    @cookieGetter('refresh_token') refreshToken: string,
  ) {
    return this.userService.getOneUserWork(refreshToken, id);
  }

  @Get('done')
  async getOnlyDone(@cookieGetter('refresh_token') refreshToken: string) {
    return this.userService.getOnlyDone(refreshToken);
  }

  @Get('todo')
  async getOnlyTodo(@cookieGetter('refresh_token') refreshToken: string) {
    return this.userService.getOnlyToDo(refreshToken);
  }

  @Get('expired')
  async getExpired(@cookieGetter('refresh_token') refreshToken: string) {
    return this.userService.getExpiredlist(refreshToken);
  }

  @Get('noexpired')
  async getnoExpired(@cookieGetter('refresh_token') refreshToken: string) {
    return this.userService.getNoExpiredlist(refreshToken);
  }

  @Post('newwork')
  async createNewWork(
    @cookieGetter('refresh_token') refreshToken: string,
    @Body() workBody: CreateWorkDto,
  ) {
    return this.userService.createWork(workBody, refreshToken);
  }

  @Patch('edit/:id')
  async updateWork(
    @Param('id') id: number,
    @Body() workBody: CreateWorkDto,
    @cookieGetter('refresh_token') refreshToken: string,
  ) {
    return this.userService.updateWork(workBody, refreshToken, id);
  }

  @Delete('del/:id')
  async deleteWork(
    @Param('id') id: number,
    @cookieGetter('refresh_token') refreshToken: string,
  ) {
    return this.userService.deleteWork(id, refreshToken);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    console.log(1112121)
    return this.userService.getOneUser(+id);
  }
}
