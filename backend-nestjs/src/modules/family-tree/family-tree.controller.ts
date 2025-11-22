import { Controller, Get, Param, Query } from '@nestjs/common';
import { FamilyTreeService } from './family-tree.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('tree')
@Controller('tree')
export class FamilyTreeController {
  constructor(private readonly familyTreeService: FamilyTreeService) {}

  @Get('root')
  getRoot() {
    return this.familyTreeService.getRootMembers();
  }

  @Get('member/:id')
  getTreeForMember(@Param('id') id: string) {
    return this.familyTreeService.getTreeForMember(id);
  }

  @Get('ancestors/:id')
  getAncestors(@Param('id') id: string, @Query('maxDepth') maxDepth?: number) {
    return this.familyTreeService.getAncestors(id, maxDepth);
  }

  @Get('descendants/:id')
  getDescendants(
    @Param('id') id: string,
    @Query('maxDepth') maxDepth?: number,
  ) {
    return this.familyTreeService.getDescendants(id, maxDepth);
  }
}
