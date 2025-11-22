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
import { MemberService } from './member.service';
import { CreateFamilyBranchDto } from './dto/create-family-branch.dto';
import { UpdateFamilyBranchDto } from './dto/update-family-branch.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/decorators/roles.decorator';

@ApiTags('family-branches')
@Controller('family-branches')
export class FamilyBranchController {
  constructor(private readonly memberService: MemberService) {}

  @Get()
  findAll() {
    return this.memberService.findAllBranches();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.memberService.findOneBranch(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLABORATOR)
  @ApiBearerAuth()
  @Post()
  create(@Body() createFamilyBranchDto: CreateFamilyBranchDto) {
    return this.memberService.createBranch(createFamilyBranchDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.COLLABORATOR)
  @ApiBearerAuth()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFamilyBranchDto: UpdateFamilyBranchDto,
  ) {
    return this.memberService.updateBranch(id, updateFamilyBranchDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.memberService.deleteBranch(id);
  }
}
