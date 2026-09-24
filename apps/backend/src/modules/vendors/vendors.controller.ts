import { Controller, Get } from '@nestjs/common';

@Controller('vendors')
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
