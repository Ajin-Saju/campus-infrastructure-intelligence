import { Injectable } from '@nestjs/common';
import { SearchRepository } from './search.repository';
import { FilterSearchDto } from './dto/search-query.dto';

@Injectable()
export class SearchService {
  constructor(private readonly repository: SearchRepository) {}

  async globalSearch(query: string, userId?: string, userRole?: string, userEmail?: string) {
    return this.repository.globalSearch(query, userId, userRole, userEmail);
  }

  async filterSearch(dto: FilterSearchDto, userId?: string, userRole?: string) {
    return this.repository.filterSearch(dto, userId, userRole);
  }
}
