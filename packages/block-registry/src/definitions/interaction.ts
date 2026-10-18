import { z } from 'zod';
import type { BlockDef } from '../types.ts';

export const buttonBlock: BlockDef = {
  type: 'button',
  title: 'Call-to-Action Button',
  description: 'Interactive button triggering navigation, modal dialogs, or workflow events',
  category: 'interaction',
  icon: 'mouse-pointer',
  isContainer: false,
  propsSchema: z.object({
    label: z.string().default('Get Started'),
    variant: z.enum(['primary', 'secondary', 'outline', 'ghost']).default('primary'),
    actionType: z.enum(['link', 'rfq', 'modal', 'flow_event']).default('link'),
    actionTarget: z.string().default(''),
    icon: z.string().optional()
  }),
  defaultProps: {
    label: 'Get Started',
    variant: 'primary',
    actionType: 'link',
    actionTarget: ''
  }
};

export const searchBoxBlock: BlockDef = {
  type: 'search_box',
  title: 'Catalog Search Bar',
  description: 'Instant keyword search bar filtering product cards across title and specs',
  category: 'interaction',
  icon: 'search',
  isContainer: false,
  propsSchema: z.object({
    placeholder: z.string().default('Search 3D catalog by model, SKU, or specification...'),
    showClearButton: z.boolean().default(true),
    targetRepeaterId: z.string().optional()
  }),
  defaultProps: {
    placeholder: 'Search 3D catalog by model, SKU, or specification...',
    showClearButton: true
  }
};

export const rfqFormBlock: BlockDef = {
  type: 'rfq_form',
  title: 'Request for Quotation (RFQ) Form',
  description: 'B2B lead generation form capturing contact details, quantity, and technical requirements',
  category: 'interaction',
  icon: 'clipboard',
  isContainer: false,
  propsSchema: z.object({
    title: z.string().default('Request an Official Quotation'),
    requireCompany: z.boolean().default(true),
    requirePhone: z.boolean().default(true),
    allowQuantityInput: z.boolean().default(true),
    consentText: z.string().default('I agree to receive quotation details and product updates.'),
    submitButtonText: z.string().default('Submit Quotation Request')
  }),
  defaultProps: {
    title: 'Request an Official Quotation',
    requireCompany: true,
    requirePhone: true,
    allowQuantityInput: true,
    consentText: 'I agree to receive quotation details and product updates.',
    submitButtonText: 'Submit Quotation Request'
  }
};

export const qrBlock: BlockDef = {
  type: 'qr_block',
  title: 'QR Code Generator',
  description: 'Vector SVG/PNG QR code linking directly to AR experience, product, or dealer page',
  category: 'interaction',
  icon: 'qr-code',
  isContainer: false,
  propsSchema: z.object({
    size: z.number().default(160),
    campaignLabel: z.string().default('Print Catalog 2027'),
    caption: z.string().default('Scan to view in 3D & Augmented Reality on your phone')
  }),
  defaultProps: {
    size: 160,
    campaignLabel: 'Print Catalog 2027',
    caption: 'Scan to view in 3D & Augmented Reality on your phone'
  }
};

export const whatsappButtonBlock: BlockDef = {
  type: 'whatsapp_button',
  title: 'WhatsApp Business Chat CTA',
  description: 'One-click WhatsApp chat link with pre-composed inquiry message for the product',
  category: 'interaction',
  icon: 'message-circle',
  isContainer: false,
  propsSchema: z.object({
    phoneNumber: z.string().default('+919876543210'),
    defaultMessage: z.string().default('Hello, I am interested in the CP-450 Centrifugal Pump shown in your interactive catalog.'),
    buttonLabel: z.string().default('Chat on WhatsApp')
  }),
  defaultProps: {
    phoneNumber: '+919876543210',
    defaultMessage: 'Hello, I am interested in the CP-450 Centrifugal Pump shown in your interactive catalog.',
    buttonLabel: 'Chat on WhatsApp'
  }
};

export const interactionBlocks = [
  buttonBlock,
  searchBoxBlock,
  rfqFormBlock,
  qrBlock,
  whatsappButtonBlock
];
