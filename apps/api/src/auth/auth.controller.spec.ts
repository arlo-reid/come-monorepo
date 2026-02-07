import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JWT_SECRET } from './constants';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: JWT_SECRET,
          signOptions: { expiresIn: '7d' },
        }),
      ],
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /auth/request-otp', () => {
    it('should return success when requesting OTP', async () => {
      const result = await controller.requestOtp({ phone: '+1234567890' });
      expect(result).toEqual({ success: true });
    });

    it('should store OTP for the phone number', async () => {
      const phone = '+1234567890';
      await controller.requestOtp({ phone });
      
      // Access the service's internal store for testing
      const storedOtp = service.getStoredOtp(phone);
      expect(storedOtp).toBeDefined();
      expect(storedOtp).toHaveLength(6);
    });
  });

  describe('POST /auth/verify-otp', () => {
    it('should verify OTP and return token for new user', async () => {
      const phone = '+1234567890';
      
      // Request OTP first
      await controller.requestOtp({ phone });
      const otp = service.getStoredOtp(phone)!;
      
      // Verify OTP
      const result = await controller.verifyOtp({ phone, code: otp });
      
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('isNewUser');
      expect(result.isNewUser).toBe(true);
      expect(result.user.phone).toBe(phone);
      expect(typeof result.token).toBe('string');
    });

    it('should return isNewUser false for existing user', async () => {
      const phone = '+1234567890';
      
      // First registration
      await controller.requestOtp({ phone });
      let otp = service.getStoredOtp(phone)!;
      await controller.verifyOtp({ phone, code: otp });
      
      // Second login
      await controller.requestOtp({ phone });
      otp = service.getStoredOtp(phone)!;
      const result = await controller.verifyOtp({ phone, code: otp });
      
      expect(result.isNewUser).toBe(false);
    });

    it('should throw UnauthorizedException for invalid OTP', async () => {
      const phone = '+1234567890';
      
      await controller.requestOtp({ phone });
      
      await expect(
        controller.verifyOtp({ phone, code: '000000' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when no OTP requested', async () => {
      await expect(
        controller.verifyOtp({ phone: '+9999999999', code: '123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Full auth flow', () => {
    it('should complete full authentication flow', async () => {
      const phone = '+1555123456';
      
      // 1. Request OTP
      const requestResult = await controller.requestOtp({ phone });
      expect(requestResult.success).toBe(true);
      
      // 2. Get the OTP (in production, this would be sent via SMS)
      const otp = service.getStoredOtp(phone);
      expect(otp).toBeDefined();
      
      // 3. Verify OTP
      const verifyResult = await controller.verifyOtp({ phone, code: otp! });
      expect(verifyResult.token).toBeTruthy();
      expect(verifyResult.user.id).toBeTruthy();
      expect(verifyResult.isNewUser).toBe(true);
      
      // 4. Token should be a valid JWT
      expect(verifyResult.token.split('.')).toHaveLength(3);
    });
  });
});
