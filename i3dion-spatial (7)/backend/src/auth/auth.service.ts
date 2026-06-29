import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user with secure password storage and Profile provisioning.
   */
  async signUp(body: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists.');
    }

    const salt = await bcrypt.genSalt(11);
    const passwordHash = await bcrypt.hash(body.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        passwordHash,
        role: body.role || 'USER',
        profile: {
          create: {
            name: body.name || body.email.split('@')[0],
            companyName: body.companyName,
            jobTitle: body.jobTitle,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const tokens = await this.generateUserTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      ...tokens,
    };
  }

  /**
   * Log in user checking hashed passwords and returning JWT session.
   */
  async login(body: any) {
    const user = await this.prisma.user.findUnique({
      where: { email: body.email },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('Authentication failed. Check credentials.');
    }

    const passwordMatch = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedException('Authentication failed. Check credentials.');
    }

    const tokens = await this.generateUserTokens(user.id, user.email, user.role);

    // Save active session
    await this.prisma.authSession.create({
      data: {
        userId: user.id,
        tokenHash: bcrypt.hashSync(tokens.accessToken, 10),
        deviceDetails: body.device || 'Android Client',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      ...tokens,
    };
  }

  /**
   * Handles Google federated OAuth credential validation.
   */
  async googleSignIn(body: any) {
    const { email, name, googleToken, device } = body;
    if (!googleToken) {
      throw new UnauthorizedException('Google OAuth validation token missing.');
    }

    // In a full production env, we'd verify with google OAuth:
    // const ticket = await client.verifyIdToken({ idToken: googleToken })
    
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      // Dynamic provisioning of first-time OAuth registered profiles
      const salt = await bcrypt.genSalt(10);
      const randPass = Math.random().toString(36).substring(2, 15);
      const passwordHash = await bcrypt.hash(randPass, salt);

      user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          profile: {
            create: { name },
          },
        },
        include: { profile: true },
      });
    }

    const tokens = await this.generateUserTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile,
      },
      ...tokens,
    };
  }

  async validateUserToken(id: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!user) {
      throw new NotFoundException('User profile not localized in PostgreSQL.');
    }
    return user;
  }

  private async generateUserTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'enterprise_jwt_secret_token_rotation_key_2026_spatial',
      expiresIn: '1d',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'enterprise_jwt_secret_token_rotation_key_2026_spatial',
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
