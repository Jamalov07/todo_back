import { Controller } from '@nestjs/common';
import { WorkService } from './works.service';

@Controller()
export class WorkController {
  constructor(private readonly workService: WorkService) {}
}
