import { supabase } from './supabase'

export async function sendEmail({ to, subject, html }) {
  const { data, error } = await supabase.functions.invoke('send-email', {
    body: { to, subject, html }
  })
  if (error) console.error('Email error:', error)
  return { data, error }
}

export const emailTemplates = {
  submitted(requesterName, reqNumber, purpose, hodName) {
    return {
      subject: `New Requisition ${reqNumber} Awaiting Your Authorization`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0C1A2E; padding: 24px 32px;">
            <h1 style="color: #fff; font-size: 18px; margin: 0;">Acti-Tech Operations Portal</h1>
          </div>
          <div style="padding: 32px; background: #F2F5FB;">
            <h2 style="color: #18243A; font-size: 16px;">New Requisition Pending Authorization</h2>
            <p style="color: #7A8EAB; font-size: 14px;">Hi ${hodName},</p>
            <p style="color: #7A8EAB; font-size: 14px;">${requesterName} has submitted a requisition that requires your authorization.</p>
            <div style="background: #fff; border: 1px solid #DDE5F0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 8px; font-size: 13px;"><strong>Ref:</strong> ${reqNumber}</p>
              <p style="margin: 0 0 8px; font-size: 13px;"><strong>Purpose:</strong> ${purpose}</p>
              <p style="margin: 0; font-size: 13px;"><strong>Submitted by:</strong> ${requesterName}</p>
            </div>
            <p style="color: #7A8EAB; font-size: 13px;">Please log in to the portal to review and authorize this request.</p>
          </div>
          <div style="background: #0C1A2E; padding: 16px 32px;">
            <p style="color: #3A5270; font-size: 11px; margin: 0;">Acti-Tech Limited · Confidential Internal System</p>
          </div>
        </div>
      `
    }
  },

  approved(requesterName, reqNumber, purpose) {
    return {
      subject: `Your Requisition ${reqNumber} Has Been Approved`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0C1A2E; padding: 24px 32px;">
            <h1 style="color: #fff; font-size: 18px; margin: 0;">Acti-Tech Operations Portal</h1>
          </div>
          <div style="padding: 32px; background: #F2F5FB;">
            <h2 style="color: #15803D; font-size: 16px;">✓ Requisition Approved</h2>
            <p style="color: #7A8EAB; font-size: 14px;">Hi ${requesterName},</p>
            <p style="color: #7A8EAB; font-size: 14px;">Your requisition has been approved by management and sent to the store for fulfillment.</p>
            <div style="background: #fff; border: 1px solid #DDE5F0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 8px; font-size: 13px;"><strong>Ref:</strong> ${reqNumber}</p>
              <p style="margin: 0; font-size: 13px;"><strong>Purpose:</strong> ${purpose}</p>
            </div>
          </div>
          <div style="background: #0C1A2E; padding: 16px 32px;">
            <p style="color: #3A5270; font-size: 11px; margin: 0;">Acti-Tech Limited · Confidential Internal System</p>
          </div>
        </div>
      `
    }
  },

  fulfilled(requesterName, reqNumber, purpose) {
    return {
      subject: `Your Requisition ${reqNumber} Has Been Fulfilled`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0C1A2E; padding: 24px 32px;">
            <h1 style="color: #fff; font-size: 18px; margin: 0;">Acti-Tech Operations Portal</h1>
          </div>
          <div style="padding: 32px; background: #F2F5FB;">
            <h2 style="color: #0369A1; font-size: 16px;">📦 Items Ready for Collection</h2>
            <p style="color: #7A8EAB; font-size: 14px;">Hi ${requesterName},</p>
            <p style="color: #7A8EAB; font-size: 14px;">Your requisition has been fulfilled. Your items are ready for collection from the store.</p>
            <div style="background: #fff; border: 1px solid #DDE5F0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 8px; font-size: 13px;"><strong>Ref:</strong> ${reqNumber}</p>
              <p style="margin: 0; font-size: 13px;"><strong>Purpose:</strong> ${purpose}</p>
            </div>
          </div>
          <div style="background: #0C1A2E; padding: 16px 32px;">
            <p style="color: #3A5270; font-size: 11px; margin: 0;">Acti-Tech Limited · Confidential Internal System</p>
          </div>
        </div>
      `
    }
  },

  rejected(requesterName, reqNumber, purpose, stage) {
    return {
      subject: `Your Requisition ${reqNumber} Was Not Approved`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0C1A2E; padding: 24px 32px;">
            <h1 style="color: #fff; font-size: 18px; margin: 0;">Acti-Tech Operations Portal</h1>
          </div>
          <div style="padding: 32px; background: #F2F5FB;">
            <h2 style="color: #B91C1C; font-size: 16px;">Requisition Not Approved</h2>
            <p style="color: #7A8EAB; font-size: 14px;">Hi ${requesterName},</p>
            <p style="color: #7A8EAB; font-size: 14px;">Your requisition was not approved at the ${stage} stage. Please contact your ${stage} for more information.</p>
            <div style="background: #fff; border: 1px solid #DDE5F0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 8px; font-size: 13px;"><strong>Ref:</strong> ${reqNumber}</p>
              <p style="margin: 0; font-size: 13px;"><strong>Purpose:</strong> ${purpose}</p>
            </div>
          </div>
          <div style="background: #0C1A2E; padding: 16px 32px;">
            <p style="color: #3A5270; font-size: 11px; margin: 0;">Acti-Tech Limited · Confidential Internal System</p>
          </div>
        </div>
      `
    }
  }
}