import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import type { AuthRequest } from '../auth/auth.guard';
import { ManagementService } from '../management/management.service';
@Controller('vendors')
@UseGuards(AuthGuard)
export class VendorsController {
  constructor(private readonly management: ManagementService) {}
  @Get() async listVendors(@Req() req: AuthRequest) {
    return { data: (await this.management.snapshot(req.user, {})).vendors };
  }
}
