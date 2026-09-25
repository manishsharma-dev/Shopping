import { Controller, Get } from '@nestjs/common';
import { ManagementService } from '../management/management.service';
@Controller('catalog')
export class CatalogController {
  constructor(private readonly management: ManagementService) {}
  @Get() listProducts() {
    return this.management.catalog();
  }
}
