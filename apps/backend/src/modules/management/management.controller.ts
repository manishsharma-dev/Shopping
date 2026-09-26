import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthRequest } from '../auth/auth.guard';
import { ManagementDto } from './management.dto';
import { ManagementService } from './management.service';

@Controller('manage')
@UseGuards(AuthGuard)
export class ManagementController {
  constructor(private readonly service: ManagementService) {}
  @Get('access') access(@Req() req: AuthRequest) {
    return this.service.capabilities(req.user);
  }
  @Get('geography') async geography(@Req() req: AuthRequest) {
    await this.service.capabilities(req.user);
    return this.service.geography();
  }
  @Get('applications') applications(@Req() req: AuthRequest) {
    return this.service.applications(req.user);
  }
  @Get() snapshot(
    @Req() req: AuthRequest,
    @Query('state') state?: string,
    @Query('district') district?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.service.snapshot(req.user, { state, district, vendorId });
  }
  @Post('apply') apply(@Req() req: AuthRequest, @Body() dto: ManagementDto) {
    return this.service.apply(req.user, dto.data);
  }
  @Post('users') user(@Req() req: AuthRequest, @Body() dto: ManagementDto) {
    return this.service.createUser(req.user, dto.data);
  }
  @Post('users/:id/status') userStatus(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: ManagementDto,
  ) {
    return this.service.userStatus(req.user, id, dto.data);
  }
  @Post('users/:id/type') userType(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: ManagementDto,
  ) {
    return this.service.assignType(req.user, id, dto.data);
  }
  @Post(':kind') create(
    @Req() req: AuthRequest,
    @Param('kind') kind: string,
    @Body() dto: ManagementDto,
  ) {
    return this.service.save(req.user, kind, dto);
  }
  @Post(':kind/:id') update(
    @Req() req: AuthRequest,
    @Param('kind') kind: string,
    @Param('id') id: string,
    @Body() dto: ManagementDto,
  ) {
    return this.service.save(req.user, kind, dto, id);
  }
}
