import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { CreateWorkDto } from './dto/create-work.dto';
import { Work } from './work.model';
import { Op } from 'sequelize';

@Injectable()
export class WorkService {
  constructor(
    @InjectModel(Work) private readonly workRepo: typeof Work,
    private readonly jwtService: JwtService,
  ) {}

  async getAll() {
    const works = await this.workRepo.findAll();
    if (works.length!) {
      throw new BadRequestException('Works not found');
    }
    return works;
  }

  async getUserWorks(userId: number) {
    const userWorks = await this.workRepo.findAll({
      where: { user_id: userId },
    });
    if (!userWorks) {
      throw new BadRequestException('User works not found');
    }

    return userWorks;
  }

  async getOne(userId: number, id: number) {
    const work = await this.workRepo.findOne({
      where: { user_id: userId, id: id },
    });
    if (!work) {
      throw new BadRequestException('Work not found');
    }
    return work;
  }

  async getOnlyDone(userId: number) {
    const works = await this.workRepo.findAll({
      where: { user_id: userId, status: true },
    });
    if (!works.length) {
      throw new BadRequestException('Done list is empty');
    }
    return works;
  }

  async getOnlyToDo(userId: number) {
    const works = await this.workRepo.findAll({
      where: { user_id: userId, status: false },
    });
    if (!works.length) {
      throw new BadRequestException('TODO list is empty');
    }
    return works;
  }

  async getOnlyExpired(userId: number) {
    const works = await this.workRepo.findAll({
      where: {
        user_id: userId,
        expired_time: {
          [Op.lt]: new Date(),
        },
      },
    });
    if (!works.length) {
      throw new BadRequestException('list is empty');
    }
    return works;
  }

  async getOnlyNoExpired(userId: number) {
    const works = await this.workRepo.findAll({
      where: {
        user_id: userId,
        expired_time: {
          [Op.gt]: new Date(),
        },
      },
    });
    if (!works.length) {
      throw new BadRequestException('list is empty');
    }
    return works;
  }

  async createWork(workBody: CreateWorkDto, refreshToken: string) {
    const userData = await this.verifyToken(refreshToken);
    const candidate = await this.workRepo.findOne({
      where: { user_id: userData.id, title: workBody.title },
    });
    if (candidate) {
      throw new BadRequestException('This todo already exists in your list');
    }
    if (userData.user_id !== workBody.user_id) {
      throw new BadRequestException('Conflict');
    }
    const newWork = await this.workRepo.create({
      ...workBody,
      user_id: userData.id,
      status: false,
    });
    return newWork;
  }

  async updateWork(workBody: CreateWorkDto, id: number, userId: number) {
    const work = await this.workRepo.findOne({
      where: { user_id: userId, id },
    });
    if (!work) {
      throw new BadRequestException('Work not found');
    }
    if (workBody.title) {
      const candidate = await this.workRepo.findOne({
        where: { title: workBody.title },
      });
      if (candidate && candidate.id != id) {
        throw new BadRequestException(
          'This title already exist in your todo list',
        );
      }
    }
    await work.update(workBody);
    return work;
  }

  async deleteWork(id: number, userId: number) {
    const work = await this.workRepo.findOne({
      where: { id: id, user_id: userId },
    });
    if (!work) {
      throw new BadRequestException('Work not found');
    }
    await work.destroy();
    return 'Work deleted';
  }

  private async verifyToken(refreshToken: string) {
    const userData = await this.jwtService.verify(refreshToken, {
      secret: process.env.REFRESH_TOKEN_KEY,
    });
    if (!userData) {
      throw new BadRequestException('user not registered');
    }

    return userData;
  }
}
