const Notification = require('../models/Notification');

class NotificationService {
  static async createNotification({ recipientId, title, message, type, relatedId = '' }) {
    try {
      if (!recipientId) return null;
      return await Notification.create({
        recipient: recipientId,
        title,
        message,
        type,
        relatedId,
      });
    } catch (err) {
      console.warn('[Notification] Failed to create notification:', err.message);
      return null;
    }
  }

  static async notifyCampaignSubmitted(campaign) {
    return this.createNotification({
      recipientId: campaign.creator,
      title: 'Campaign Submitted for Verification',
      message: `Your campaign "${campaign.title}" has been submitted and is currently queued for automated risk assessment and administrator verification.`,
      type: 'CAMPAIGN_SUBMITTED',
      relatedId: campaign._id.toString(),
    });
  }

  static async notifyCampaignApproved(campaign) {
    return this.createNotification({
      recipientId: campaign.creator,
      title: 'Campaign Approved & Active',
      message: `Congratulations! Your campaign "${campaign.title}" has been verified and approved by administrators. It is now live for public donations.`,
      type: 'CAMPAIGN_APPROVED',
      relatedId: campaign._id.toString(),
    });
  }

  static async notifyCampaignRejected(campaign, notes) {
    return this.createNotification({
      recipientId: campaign.creator,
      title: 'Campaign Verification Status: Rejected',
      message: `Your campaign "${campaign.title}" was not approved. Reason: ${notes || 'Verification criteria not met.'}`,
      type: 'CAMPAIGN_REJECTED',
      relatedId: campaign._id.toString(),
    });
  }

  static async notifyInfoRequested(campaign, notes) {
    return this.createNotification({
      recipientId: campaign.creator,
      title: 'Additional Information Requested',
      message: `The review team requested more details for "${campaign.title}": ${notes || 'Please upload additional supporting documentation.'}`,
      type: 'ADDITIONAL_INFO_REQUESTED',
      relatedId: campaign._id.toString(),
    });
  }

  static async notifyNewDonation(campaign, amount, donorName) {
    return this.createNotification({
      recipientId: campaign.creator,
      title: 'New Donation Received!',
      message: `You received a donation of ₹${Number(amount).toLocaleString('en-IN')} from ${donorName || 'a generous donor'} for "${campaign.title}".`,
      type: 'NEW_DONATION',
      relatedId: campaign._id.toString(),
    });
  }

  static async notifyGoalReached(campaign) {
    return this.createNotification({
      recipientId: campaign.creator,
      title: 'Fundraising Target Achieved!',
      message: `Amazing news! Your campaign "${campaign.title}" has successfully reached its target goal of ₹${Number(campaign.targetAmount).toLocaleString('en-IN')}. It is now eligible for settlement review.`,
      type: 'GOAL_REACHED',
      relatedId: campaign._id.toString(),
    });
  }

  static async notifySettlementUpdated(campaign, status, reference) {
    return this.createNotification({
      recipientId: campaign.creator,
      title: 'Settlement Status Updated',
      message: `Settlement for "${campaign.title}" status changed to: ${status}. Reference ID: ${reference}.`,
      type: 'SETTLEMENT_UPDATED',
      relatedId: campaign._id.toString(),
    });
  }
}

module.exports = NotificationService;
