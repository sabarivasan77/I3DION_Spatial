import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Register a new AR or system telemetry event log.
   */
  async logEvent(body: any) {
    return this.prisma.analyticsEvent.create({
      data: {
        eventType: body.eventType,          // e.g. "PLACEMENT_SUCCESS", "PLACEMENT_FAILURE", "MODEL_LOADED"
        productId: body.productId,
        userId: body.userId,
        deviceModel: body.device || 'Android Client',
        sessionDuration: body.duration || 0,
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      },
    });
  }

  /**
   * High-Performance aggregate reports compilation for operators dashboards
   */
  async getDashboardSummary() {
    const totalArLaunches = await this.prisma.analyticsEvent.count({
      where: { eventType: 'AR_OPENED' },
    });

    const totalPlacementSuccess = await this.prisma.analyticsEvent.count({
      where: { eventType: 'PLACEMENT_SUCCESS' },
    });

    const totalPlacementFailure = await this.prisma.analyticsEvent.count({
      where: { eventType: 'PLACEMENT_FAILURE' },
    });

    const totalQrScans = await this.prisma.analyticsEvent.count({
      where: { eventType: 'QR_SCANNED' },
    });

    const totalDownloads = await this.prisma.download.count();

    // Top active products by launches
    const activeProductsGroup = await this.prisma.analyticsEvent.groupBy({
      by: ['productId'],
      where: { productId: { not: null } },
      _count: {
        productId: true,
      },
      orderBy: {
        _count: {
          productId: 'desc',
        },
      },
      take: 5,
    });

    // Resolve products details
    const topProducts = await Promise.all(
      activeProductsGroup.map(async (group) => {
        const product = await this.prisma.product.findUnique({
          where: { id: group.productId },
          select: { name: true, category: { select: { name: true } } },
        });
        return {
          productId: group.productId,
          count: group._count.productId,
          name: product?.name || 'Unknown Component',
          category: product?.category?.name || 'General',
        };
      }),
    );

    // Calculate placement rates
    const totalPlacementsAttempted = totalPlacementSuccess + totalPlacementFailure;
    const placementAccuracyRate = totalPlacementsAttempted > 0
      ? (totalPlacementSuccess / totalPlacementsAttempted) * 100
      : 100.0;

    return {
      overview: {
        totalArLaunches,
        totalDownloads,
        totalQrScans,
        placementAccuracyRate: `${placementAccuracyRate.toFixed(1)}%`,
        activeDeviceCount: 15, // Mocked live aggregate trace
      },
      topProducts,
      recentEvents: await this.prisma.analyticsEvent.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: { product: { select: { name: true } } },
      }),
    };
  }
}
