import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { WorkModule } from '../works/works.module';
import { User } from './user.model';
import { UserController } from './users.controller';
import { UserService } from './users.service';

@Module({
  imports: [
    SequelizeModule.forFeature([User]),
    JwtModule.register({}),
    forwardRef(() => WorkModule),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
