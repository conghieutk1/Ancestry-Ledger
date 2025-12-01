import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findOneByEmail(email);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash: _passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return {
      ...tokens,
      user,
    };
  }

  async logout(userId: string) {
    return this.userService.update(userId, { currentHashedRefreshToken: null });
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userService.findOneById(userId);
    if (!user || !user.currentHashedRefreshToken)
      throw new ForbiddenException('Access Denied');

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.currentHashedRefreshToken,
    );
    if (!refreshTokenMatches) throw new ForbiddenException('Access Denied');

    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.userService.update(userId, {
      currentHashedRefreshToken: hash,
    });
  }

  async getTokens(userId: string, email: string, role: string) {
    const payload = {
      sub: userId,
      email,
      role,
    };
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '15m',
        secret: process.env.JWT_SECRET,
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
        secret: process.env.JWT_SECRET, // Using same secret for simplicity, ideally different
      }),
    ]);

    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userService.findOneByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(registerDto.password, salt);

    const user = await this.userService.createUser({
      email: registerDto.email,
      passwordHash,
      displayName: registerDto.displayName,
      role: registerDto.role, // Use role from DTO
    });

    return this.login(user);
  }
}
