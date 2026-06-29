import { Controller, Post, Body, Get, Param, HttpStatus, HttpCode } from '@nestjs/common';
import { QrService } from './qr.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('QR Distribution Infrastructure')
@Controller('qr')
export class QrController {
  constructor(private readonly qrService: QrService) {}

  @Post('scan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve a scanned QR code payload string' })
  @ApiResponse({ status: 200, description: 'Payload resolved to Product entity successfully.' })
  @ApiResponse({ status: 404, description: 'QR data payload signature mismatch.' })
  async scanCode(
    @Body('payload') payload: string,
    @Body('userId') userId?: string,
    @Body('device') device?: string,
  ) {
    return this.qrService.scanProductPayload(payload, userId, device);
  }

  @Post('rebuild/:productId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Force-refresh or distribute product QR matrices' })
  async rebuildQr(
    @Param('productId') productId: string,
    @Body('productName') productName: string,
  ) {
    return this.qrService.generateAndRegisterQrForProduct(productId, productName);
  }
}
