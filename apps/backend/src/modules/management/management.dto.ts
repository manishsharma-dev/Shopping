import { IsInt, IsObject, IsOptional, Min } from 'class-validator';

export class ManagementDto {
  @IsObject() data: Record<string, unknown>;
  @IsOptional() @IsInt() @Min(1) version?: number;
}
