import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard, AuthGuard } from '../auth/auth.guard';

@Controller('vendors')
@UseGuards(AuthGuard, AdminGuard)
export class VendorsController {
  @Get()
  listVendors() {
    return {
      data: [
        { id: 'ven_1', name: 'Northwind Labs', status: 'active' },
        { id: 'ven_2', name: 'Blue River Goods', status: 'pending' },
      ],
    };
  }
}
