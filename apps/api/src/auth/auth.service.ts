import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface User {
  id: string;
  phone: string;
  createdAt: Date;
}

@Injectable()
export class AuthService {
  // In-memory stores (mock for now)
  private otpStore = new Map<string, { code: string; expiresAt: number }>();
  private userStore = new Map<string, User>();

  constructor(private jwtService: JwtService) {}

  async requestOtp(phone: string): Promise<{ success: boolean }> {
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with 5-minute expiry
    this.otpStore.set(phone, {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    // In production, this would send an SMS
    console.log(`[DEV] OTP for ${phone}: ${code}`);

    return { success: true };
  }

  async verifyOtp(
    phone: string,
    code: string,
  ): Promise<{ token: string; user: User; isNewUser: boolean }> {
    const stored = this.otpStore.get(phone);

    if (!stored) {
      throw new UnauthorizedException('No OTP requested for this phone');
    }

    if (Date.now() > stored.expiresAt) {
      this.otpStore.delete(phone);
      throw new UnauthorizedException('OTP has expired');
    }

    if (stored.code !== code) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // OTP is valid, clear it
    this.otpStore.delete(phone);

    // Check if user exists
    let user = this.userStore.get(phone);
    let isNewUser = false;

    if (!user) {
      // Create new user
      user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        phone,
        createdAt: new Date(),
      };
      this.userStore.set(phone, user);
      isNewUser = true;
    }

    // Generate JWT token
    const payload = { sub: user.id, phone: user.phone };
    const token = this.jwtService.sign(payload);

    return { token, user, isNewUser };
  }

  async validateUser(userId: string): Promise<User | null> {
    // Find user by ID
    for (const user of this.userStore.values()) {
      if (user.id === userId) {
        return user;
      }
    }
    return null;
  }

  // Test helpers
  getStoredOtp(phone: string): string | undefined {
    return this.otpStore.get(phone)?.code;
  }
}
