import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { UserService } from '../user/user.service';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(private readonly userService: UserService) {}

  @Get('users')
  getUsers() {
    // TODO: Implement pagination and filtering
    return 'List of users';
  }

  @Patch('users/:id/role')
  updateUserRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.userService.update(id, { role });
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.userService.update(id, { isActive });
  }

  @Post('invitations')
  createInvitation(@Body() _body: any) {
    // TODO: Implement invitation creation logic
    return 'Invitation created';
  }

  @Get('invitations')
  getInvitations() {
    return 'List of invitations';
  }
}
