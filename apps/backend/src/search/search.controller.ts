import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { SearchService } from './search.service';
import { FilterSearchDto } from './dto/search-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('global')
  async globalSearch(@Query('q') q: string, @Request() req: any) {
    const userId = req.user?.id;
    const userRole = req.user?.role?.name || '';
    const userEmail = req.user?.email || '';
    return this.searchService.globalSearch(q || '', userId, userRole, userEmail);
  }

  @Get('filter')
  async filterSearch(@Query() dto: FilterSearchDto, @Request() req: any) {
    const userId = req.user?.id;
    const userRole = req.user?.role?.name || '';
    return this.searchService.filterSearch(dto, userId, userRole);
  }
}
