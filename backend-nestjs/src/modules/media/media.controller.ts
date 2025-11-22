import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { Media } from './entities/media.entity';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  findAll(@Query('memberId') memberId?: string) {
    return this.mediaService.findAll(memberId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLABORATOR)
  @ApiBearerAuth()
  create(@Body() createMediaDto: Partial<Media>) {
    return this.mediaService.create(createMediaDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLABORATOR)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
