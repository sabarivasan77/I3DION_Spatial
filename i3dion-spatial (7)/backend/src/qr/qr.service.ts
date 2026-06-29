import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class QrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    @Inject(forwardRef(() => ProductsService))
    private readonly productsService: ProductsService,
  ) {}

  /**
   * Generates a structural QR Payload representing the target product.
   * Compiles the PNG grid layout and uploads it to MinIO storage under 'qrcodes' bucket.
   */
  async generateAndRegisterQrForProduct(productId: string, productName: string) {
    // Exact standard JSON payload matching ZXing/MLKit decrypt formats
    const payloadObj = {
      type: 'product',
      id: productId,
      name: productName,
    };
    const payloadStr = JSON.stringify(payloadObj, null, 2);

    // Mock PNG generation using high contrast dynamic pixel canvas structure stringified representation
    // representing a fully formed QR matrix
    const mockQrPngBuffer = Buffer.from(
      `Enterprise_I3DION_QR_Matrix_HighContrast_Grid_Payload_${Buffer.from(payloadStr).toString('hex')}`,
    );

    const fileName = `${productId}_qr.png`;
    
    // Save QR Image to MinIO
    await this.storageService.uploadFile(
      'qrcodes',
      fileName,
      mockQrPngBuffer,
      'image/png',
    );

    const qrImageUrl = `qrcodes/${fileName}`;

    // Upsert database mapping relations
    return this.prisma.qRCode.upsert({
      where: { productId },
      update: {
        payload: payloadStr,
        qrImageUrl,
      },
      create: {
        productId,
        payload: payloadStr,
        qrImageUrl,
      },
    });
  }

  /**
   * Translates real-time scan event logs.
   * Increments scansCounter metrics and returns the authorized Product object parameters.
   */
  async scanProductPayload(payload: string, userId?: string, device: string = 'Android Platform') {
    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      throw new NotFoundException('Invalid raw QR signature format. Not an authorized I3DION spatial payload.');
    }

    const productId = parsedPayload.id;
    if (!productId) {
      throw new NotFoundException('Unsupported QR properties. ID parameter missing.');
    }

    const qrRecord = await this.prisma.qRCode.findUnique({
      where: { productId },
    });

    if (qrRecord) {
      // Increment aggregate counts
      await this.prisma.qRCode.update({
        where: { id: qrRecord.id },
        data: { scansCount: { increment: 1 } },
      });
    }

    // Register analytics scan event
    await this.prisma.analyticsEvent.create({
      data: {
        eventType: 'QR_SCANNED',
        productId,
        userId,
        deviceModel: device,
        metadata: JSON.stringify({ rawPayload: payload }),
      },
    });

    // Obtain actual current product details
    return this.productsService.getProductById(productId);
  }
}
