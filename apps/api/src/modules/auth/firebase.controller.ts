import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';

@Controller('api/v1/auth/firebase')
export class FirebaseController {
  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  @Post('verify')
  async verify(@Body() body: { idToken?: string }) {
    if (!body?.idToken) {
      throw new HttpException('idToken required', HttpStatus.BAD_REQUEST);
    }

    const decoded = await this.firebaseAdmin.verifyIdToken(body.idToken);
    // Map commonly-used identity fields
    const { uid, phone_number, email } = decoded as any;

    return {
      provider: 'firebase',
      uid,
      phoneNumber: phone_number,
      email,
    };
  }
}
