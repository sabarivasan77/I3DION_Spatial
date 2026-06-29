import { Controller, Post, Body, Get, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new enterprise user' })
  @ApiResponse({ status: 201, description: 'User account created successfully.' })
  @ApiResponse({ status: 409, description: 'Email address already in use.' })
  async signUp(@Body() signUpDto: any) {
    return this.authService.signUp(signUpDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate and retrieve user access token' })
  @ApiResponse({ status: 200, description: 'Credentials authorized successfully.' })
  @ApiResponse({ status: 401, description: 'Access denied: invalid password or email.' })
  async login(@Body() loginDto: any) {
    return this.authService.login(loginDto);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Federated login via Google account structures' })
  @ApiResponse({ status: 200, description: 'Google Identity authenticated.' })
  async googleSignIn(@Body() googleDto: any) {
    return this.authService.googleSignIn(googleDto);
  }
}
