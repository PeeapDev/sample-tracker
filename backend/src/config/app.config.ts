import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME || 'NSRTMS',
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  smsApiKey: process.env.SMS_API_KEY || '',
  smsSenderId: process.env.SMS_SENDER_ID || 'NSRTMS',
  pushPublicKey: process.env.PUSH_PUBLIC_KEY || '',
  pushPrivateKey: process.env.PUSH_PRIVATE_KEY || '',
}));
