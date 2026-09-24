import { Controller, Get } from '@nestjs/common';

@Controller('catalog')
export class CatalogController {
  @Get()
  listProducts() {
    return {
      items: [
        { id: 'prod_1001', name: 'Premium Hoodie', sku: 'HD-1001', price: 89.0 },
        { id: 'prod_1002', name: 'Running Sneakers', sku: 'SN-1002', price: 129.0 },
        { id: 'prod_1003', name: 'Travel Backpack', sku: 'BP-1003', price: 149.0 },
      ],
    };
  }
}
