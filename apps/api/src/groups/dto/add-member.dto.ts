import { IsString, IsOptional, IsIn } from 'class-validator';
import { GroupRole } from '@prisma/client';

export class AddMemberDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsIn(['ADMIN', 'MEMBER'])
  role?: GroupRole;
}
