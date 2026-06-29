import { Controller, Post, Body, Get, HttpStatus, HttpCode } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('AR Telemetry & SaaS Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('event')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log a telemetry or placement success event' })
  @ApiResponse({ status: 200, description: 'Event tracked successfully.' })
  async logTelemetryEvent(@Body() body: any) {
    return this.analyticsService.logEvent(body);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Retrieve high-level dashboard aggregate reports' })
  @ApiResponse({ status: 200, description: 'Compiled data analytics.' })
  async getDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }
}
