import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.model';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { WorkService } from '../works/works.service';
import { CreateWorkDto } from '../works/dto/create-work.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User) private readonly userRepo: typeof User,
    private readonly jwtService: JwtService,
    private readonly workService: WorkService,
  ) {}

  async registration(userBody: CreateUserDto, res: Response) {
    const canInUser = await this.userRepo.findOne({
      where: { username: userBody.username },
    });
    if (canInUser) {
      throw new BadRequestException('Username already exists');
    }
    const hashed_password = await bcrypt.hash(userBody.password, 7);

    const newUser = await this.userRepo.create({
      ...userBody,
      password: hashed_password,
    });

    const tokens = await this.getTokens(newUser.id);

    const updatedUser = await this.updateRefreshTokenHash(
      newUser.id,
      tokens.refresh_token,
    );
    const response = {
      message: 'User registered',
      user: updatedUser,
      tokens,
    };

    // localStorage.setItem('refresh_token', tokens.refresh_token);
    res.cookie('refresh_token', tokens.refresh_token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    return response;
  }

  async login(authBody: CreateUserDto, res: Response) {
    const { username, password } = authBody;

    const user = await this.userRepo.findOne({ where: { username: username } });
    if (!user) {
      throw new UnauthorizedException('User not registered1');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('User not registered2');
    }

    const tokens = await this.getTokens(user.id);
    const updatedUser = await this.updateRefreshTokenHash(
      user.id,
      tokens.refresh_token,
    );
    const response = {
      message: 'User logged in',
      user: updatedUser,
      tokens,
    };
    // localStorage.setItem('refresh_token', tokens.refresh_token);
    res.cookie('refresh_token', tokens.refresh_token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    return response;
  }

  async refreshToken(userId: number, refreshToken: string, res: Response) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.refresh_token) {
      throw new BadRequestException(
        'admin not found or his refresh column is epmty',
      );
    }
    const refreshMatches = await bcrypt.compare(
      refreshToken,
      user.refresh_token,
    );
    if (!refreshMatches) {
      throw new ForbiddenException(
        'A change has been made to the refresh token',
      );
    }
    const tokens = await this.getTokens(userId);
    const updatedUser = await this.updateRefreshTokenHash(
      user.id,
      tokens.refresh_token,
    );

    const response = {
      message: 'User refreshed',
      user: updatedUser,
      tokens,
    };
    // localStorage.setItem('refresh_token', tokens.refresh_token);
    res.cookie('refresh_token', tokens.refresh_token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });
    return response;
  }

  async logout(refreshToken: string, res: Response) {
    const userData = await this.jwtService.verify(refreshToken, {
      secret: process.env.REFRESH_TOKEN_KEY,
    });
    if (!userData) {
      throw new ForbiddenException('User not found');
    }
    const updatedUser = await (
      await this.userRepo.update(
        { refresh_token: null },
        { where: { id: userData.id }, returning: true },
      )
    )[(1)[0]];
    // localStorage.setItem('refresh_token', null);
    res.clearCookie('refresh_token');
    const response = {
      message: 'user has logged out',
      admin: updatedUser,
    };
    return response;
  }

  async getUsers() {
    const users = await this.userRepo.findAll();
    if (!users.length) {
      throw new BadRequestException('users not found');
    }
    return users;
  }

  async getOneUser(id: number) {
    const user = await this.userRepo.findOne({ where: { id: id } });
    if (!user) {
      throw new BadRequestException('user not found');
    }
    return user;
  }

  async delete(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('user not found');
    }
    await this.userRepo.destroy({ where: { id: id } });
    return { message: 'user deleted', user: user };
  }

  async getTokens(userId: number) {
    const jwtPayload = {
      id: userId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: process.env.ACCESS_TOKEN_KEY,
        expiresIn: process.env.ACCESS_TOKEN_TIME,
      }),
      this.jwtService.signAsync(jwtPayload, {
        secret: process.env.REFRESH_TOKEN_KEY,
        expiresIn: process.env.REFRESH_TOKEN_TIME,
      }),
    ]);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async updateRefreshTokenHash(userId: number, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 7);
    const updatedAdmin = await (
      await this.userRepo.update(
        { refresh_token: hashedRefreshToken },
        { where: { id: userId }, returning: true },
      )
    )[1][0];
    return updatedAdmin;
  }

  // ==========

  async getUserWorks(refreshToken: string) {
    const userData = await this.verifyToken(refreshToken);
    const userWorks = await this.workService.getUserWorks(userData.id);
    return userWorks;
  }

  async getOneUserWork(refreshToken: string, id: number) {
    const userData = await this.verifyToken(refreshToken);
    const work = await this.workService.getOne(userData.id, id);
    return work;
  }

  async getOnlyDone(refreshToken: string) {
    const userData = await this.verifyToken(refreshToken);
    const works = await this.workService.getOnlyDone(userData.id);
    return works;
  }

  async getOnlyToDo(refreshToken: string) {
    const userData = await this.verifyToken(refreshToken);
    const works = await this.workService.getOnlyToDo(userData.id);
    return works;
  }

  async getExpiredlist(refreshToken: string) {
    const userData = await this.verifyToken(refreshToken);
    const works = await this.workService.getOnlyExpired(userData.id);
    return works;
  }

  async getNoExpiredlist(refreshToken: string) {
    const userData = await this.verifyToken(refreshToken);
    const works = await this.workService.getOnlyNoExpired(userData.id);
    return works;
  }
  async createWork(workBody: CreateWorkDto, refreshToken: string) {
    //   const userData = await this.verifyToken(refreshToken);
    const work = await this.workService.createWork(workBody, refreshToken);

    return work;
  }

  async updateWork(workBody: CreateWorkDto, refreshToken: string, id: number) {
    const userData = await this.verifyToken(refreshToken);
    const updatedWork = await this.workService.updateWork(
      workBody,
      id,
      userData.id,
    );
    return updatedWork;
  }

  async deleteWork(id: number, refreshToken: string) {
    const userData = await this.verifyToken(refreshToken);
    const message = await this.workService.deleteWork(id, userData.id);
    return message;
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
