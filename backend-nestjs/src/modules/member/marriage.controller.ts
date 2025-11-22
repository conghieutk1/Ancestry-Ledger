import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MarriageService } from './marriage.service';
import { CreateMarriageDto } from './dto/create-marriage.dto';
import { UpdateMarriageDto } from './dto/update-marriage.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';

@ApiTags('marriages')
@Controller('marriages')
export class MarriageController {
  constructor(private readonly marriageService: MarriageService) {}

  @Get()
  findAll() {
    return this.marriageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.marriageService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLABORATOR)
  @ApiBearerAuth()
  create(@Body() createMarriageDto: CreateMarriageDto) {
    return this.marriageService.create(createMarriageDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLABORATOR)
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() updateMarriageDto: UpdateMarriageDto,
  ) {
    return this.marriageService.update(id, updateMarriageDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  remove(@Param('id') id: string) {
    return this.marriageService.remove(id);
  }
}
