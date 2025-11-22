import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }), // Should use different secret in real app
      user,
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

    const newUser = await this.userService.create({
      email: registerDto.email,
      passwordHash,
      displayName: registerDto.displayName,
      // memberId logic to be added if needed
    });

    const { passwordHash: _, ...result } = newUser;
    return result;
  }
}
