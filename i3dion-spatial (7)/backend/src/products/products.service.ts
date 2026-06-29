import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { QrService } from '../qr/qr.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    @Inject(forwardRef(() => QrService))
    private readonly qrService: QrService,
  ) {}

  /**
   * Retrieves products with dynamically signed secure URLs.
   */
  async getAllProducts(categoryId?: string, search?: string) {
    const whereClause: any = {};
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await this.prisma.product.findMany({
      where: whereClause,
      include: { category: true, qrCode: true },
    });

    // Replace static raw paths in PostgreSQL with secure short-lived CDN Signed URLs
    return Promise.all(
      products.map(async (p) => {
        const secureModelUrl = p.modelUrl.startsWith('http')
          ? p.modelUrl
          : await this.storageService.generateSignedDownloadUrl(p.modelUrl);
          
        return {
          ...p,
          modelUrl: secureModelUrl,
        };
      }),
    );
  }

  async getProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, qrCode: true },
    });

    if (!product) {
      throw new NotFoundException(`Product spec not localized with ID: ${id}`);
    }

    const secureModelUrl = product.modelUrl.startsWith('http')
      ? product.modelUrl
      : await this.storageService.generateSignedDownloadUrl(product.modelUrl);

    return {
      ...product,
      modelUrl: secureModelUrl,
    };
  }

  /**
   * Complete Enterprise Upload pipeline
   * Uploading Thumbnail + Model File -> Optimizing -> Storing -> Registering -> QR generation
   */
  async createProduct(
    productData: any,
    modelFile?: Express.Multer.File,
    thumbnailFile?: Express.Multer.File,
  ) {
    // 1) Verify OR provision valid parent category ID
    let category = await this.prisma.category.findUnique({
      where: { name: productData.category },
    });

    if (!category) {
      const slug = productData.category.toLowerCase().replace(/ /g, '-');
      category = await this.prisma.category.create({
        data: { name: productData.category, slug },
      });
    }

    // 2) Processing files via Object storage
    let modelUrl = productData.modelUrl || '';
    let fileSize = productData.fileSize || '0.0 MB';
    let thumbnail = productData.thumbnail || '';

    if (modelFile) {
      // Validate GLB mesh structural integrity prior to pipeline submission
      const optimizedBuffer = await this.storageService.validateAndOptimizeGlb(
        modelFile.buffer,
        modelFile.originalname,
      );
      
      const fileExt = modelFile.originalname.split('.').pop();
      const objectName = `${Date.now()}_model.${fileExt}`;
      
      // Save optimized GLB into bucket
      const uploadedPath = await this.storageService.uploadFile(
        'models',
        objectName,
        optimizedBuffer,
        'application/octet-stream',
      );
      modelUrl = uploadedPath;
      fileSize = `${(optimizedBuffer.length / (1024 * 1024)).toFixed(1)} MB`;
    }

    if (thumbnailFile) {
      const thumbExt = thumbnailFile.originalname.split('.').pop();
      const objectName = `${Date.now()}_thumb.${thumbExt}`;
      const uploadedPath = await this.storageService.uploadFile(
        'images',
        objectName,
        thumbnailFile.buffer,
        thumbnailFile.mimetype,
      );
      thumbnail = uploadedPath;
    }

    // 3) Create product entry in DB
    const product = await this.prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description || '',
        categoryId: category.id,
        modelUrl,
        fileSize,
        version: productData.version || '1.0.0',
        thumbnail,
        documentName: productData.documentName,
        documentUrl: productData.documentUrl,
        specs: productData.specs,
        benefits: productData.benefits,
      },
    });

    // 4) Auto Generate Product Link QR Image Asset for distribution
    const qrEntity = await this.qrService.generateAndRegisterQrForProduct(product.id, product.name);

    return {
      message: 'Product specs and optimized model registered under enterprise pipeline.',
      product: {
        ...product,
        qrCode: qrEntity,
      },
    };
  }

  /**
   * Log downloads telemetry metrics securely.
   */
  async registerDownload(productId: string, userId: string, device: string = 'Android Platform') {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException('Product not localized.');

    return this.prisma.download.create({
      data: {
        productId,
        userId,
        device,
      },
    });
  }

  /**
   * Toggles Watchlist Favorite State.
   */
  async toggleWatchlist(productId: string, userId: string) {
    const existing = await this.prisma.watchlist.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });

    if (existing) {
      await this.prisma.watchlist.delete({
        where: { id: existing.id },
      });
      return { favorited: false, message: 'Removed from core watchlist.' };
    } else {
      await this.prisma.watchlist.create({
        data: { userId, productId },
      });
      return { favorited: true, message: 'Saved to cloud telemetry favorites.' };
    }
  }

  async getWatchlist(userId: string) {
    const watchlist = await this.prisma.watchlist.findMany({
      where: { userId },
      include: { product: { include: { category: true } } },
    });
    return watchlist.map((w) => w.product);
  }
}
