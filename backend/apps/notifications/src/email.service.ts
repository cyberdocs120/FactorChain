import { Injectable, Logger } from '@nestjs/common';
import { NotificationPayload } from './interfaces';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resendApiKey: string | null;

  constructor() {
    this.resendApiKey = process.env.RESEND_API_KEY ?? null;
  }

  async send(payload: NotificationPayload): Promise<boolean> {
    if (!payload.email) {
      this.logger.debug(`No email for ${payload.user_address}, skipping`);
      return false;
    }

    const subject = this.getSubject(payload.type);
    const body = this.getBody(payload);

    if (!this.resendApiKey) {
      this.logger.log(
        `[MOCK EMAIL] To: ${payload.email}, Subject: ${subject}, Body: ${body}`,
      );
      return true;
    }

    try {
      this.logger.log(`Sending email to ${payload.email}: ${subject}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send email: ${err}`);
      return false;
    }
  }

  private getSubject(type: string): string {
    const subjects: Record<string, string> = {
      'invoice.minted': 'Invoice Minted Successfully',
      'invoice.status_changed': 'Invoice Status Updated',
      'listing.created': 'Your Invoice is Now Listed',
      'bid.placed': 'New Bid Received',
      'bid.accepted': 'Your Bid Has Been Accepted',
      'escrow.created': 'Escrow Created - Invoice Funded',
      'escrow.settled': 'Invoice Settled',
      'default.triggered': 'Default Notice',
      'pool.deposit': 'Pool Deposit Confirmed',
      'pool.withdraw': 'Pool Withdrawal Confirmed',
      'score.updated': 'Your Risk Score Has Been Updated',
    };
    return subjects[type] ?? 'FactorChain Notification';
  }

  private getBody(payload: NotificationPayload): string {
    return JSON.stringify(payload.data, null, 2);
  }
}
