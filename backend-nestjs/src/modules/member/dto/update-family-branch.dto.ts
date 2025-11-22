import { PartialType } from '@nestjs/swagger';
import { CreateFamilyBranchDto } from './create-family-branch.dto';

export class UpdateFamilyBranchDto extends PartialType(CreateFamilyBranchDto) {}
