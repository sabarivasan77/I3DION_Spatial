import { Controller, Get, Post, Body, Param, Query, UseInterceptors, UploadedFiles, UseGuards, Req, HttpStatus, HttpCode } from '@nestjs/common';
import { ProductsService } from './products.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Product Catalog & Models')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all industrial inventory models' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category UUID' })
  @ApiQuery({ name: 'search', required: false, description: 'Search name & description keywords' })
  @ApiResponse({ status: 200, description: 'Array of products with short-lived signed URLs.' })
  async getAllProducts(
    @Query('category') categoryId?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.getAllProducts(categoryId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single detailed product spec sheet' })
  @ApiResponse({ status: 200, description: 'Detailed product item.' })
  @ApiResponse({ status: 404, description: 'Product ID is missing.' })
  async getProductById(@Param('id') id: string) {
    return this.productsService.getProductById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'operator asset entrypoint: upload GLB model & thumbnail' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'model', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
    ]),
  )
  async createProduct(
    @Body() body: any,
    @UploadedFiles()
    files: {
      model?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    const modelFile = files?.model?.[0];
    const thumbnailFile = files?.thumbnail?.[0];
    return this.productsService.createProduct(body, modelFile, thumbnailFile);
  }

  @Post(':id/download-log')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register model download events' })
  async logDownload(
    @Param('id') id: string,
    @Body('userId') userId: string,
    @Body('device') device?: string,
  ) {
    return this.productsService.registerDownload(id, userId, device);
  }

  @Post(':id/favorite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle Watchlist item state' })
  async toggleFavorite(
    @Param('id') id: string,
    @Body('userId') userId: string,
  ) {
    return this.productsService.toggleWatchlist(id, userId);
  }

  @Get('watchlist/:userId')
  @ApiOperation({ summary: 'View watchlist catalog for a user' })
  async getWatchlist(@Param('userId') userId: string) {
    return this.productsService.getWatchlist(userId);
  }
}
