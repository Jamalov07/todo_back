import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { Work } from './work.model';
import { WorkController } from './works.controller';
import { WorkService } from './works.service';

@Module({
  imports: [SequelizeModule.forFeature([Work]), JwtModule.register({})],
  controllers: [WorkController],
  providers: [WorkService],
  exports: [WorkService],
})
export class WorkModule {}
