import { Voucher, VoucherStatus } from "@/types/voucher";

let counter = 0;

export function generateVoucherNumber(): string {
  const year = new Date().getFullYear();
  counter++;
  return `VOU-${year}-${String(counter).padStart(3, "0")}`;
}

export const STATUS_CONFIG: Record<VoucherStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
  pending: {
    label: "Pending Approval",
    className: "bg-warning/10 text-warning",
  },
  approved: {
    label: "Approved",
    className: "bg-success/10 text-success",
  },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/10 text-destructive",
  },
};

export function createSampleVouchers(): Voucher[] {
  const vouchers: Voucher[] = [
    {
      id: "1",
      number: "VOU-2024-001",
      description: "Office Supplies — Q4 Restock",
      amount: 2450.00,
      currency: "USD",
      status: "approved",
      createdBy: { name: "Sarah Chen", avatar: "SC" },
      createdAt: new Date("2024-12-10T09:14:00"),
      updatedAt: new Date("2024-12-11T14:30:00"),
      approvedBy: { name: "Michael Torres", avatar: "MT" },
      attachments: [
        { id: "a1", name: "invoice_supplies_q4.pdf", type: "pdf", size: 245000, uploadedAt: new Date("2024-12-10T09:15:00") },
      ],
      activityLog: [
        { id: "l1", action: "created", user: "Sarah Chen", timestamp: new Date("2024-12-10T09:14:00"), detail: "Voucher created" },
        { id: "l2", action: "attachment", user: "Sarah Chen", timestamp: new Date("2024-12-10T09:15:00"), detail: "Attached 'invoice_supplies_q4.pdf'" },
        { id: "l3", action: "submitted", user: "Sarah Chen", timestamp: new Date("2024-12-10T09:20:00"), detail: "Submitted for approval" },
        { id: "l4", action: "approved", user: "Michael Torres", timestamp: new Date("2024-12-11T14:30:00"), detail: "Voucher approved" },
      ],
      lineItems: [
        { description: "A4 Paper (10 reams)", quantity: 10, unitPrice: 45.00, total: 450.00 },
        { description: "Ink Cartridges", quantity: 8, unitPrice: 125.00, total: 1000.00 },
        { description: "Filing Cabinets", quantity: 2, unitPrice: 500.00, total: 1000.00 },
      ],
    },
    {
      id: "2",
      number: "VOU-2024-002",
      description: "Software Licenses — Annual Renewal",
      amount: 12800.00,
      currency: "USD",
      status: "pending",
      createdBy: { name: "James Liu", avatar: "JL" },
      createdAt: new Date("2024-12-14T11:00:00"),
      updatedAt: new Date("2024-12-14T11:05:00"),
      attachments: [
        { id: "a2", name: "license_agreement_2025.pdf", type: "pdf", size: 1200000, uploadedAt: new Date("2024-12-14T11:02:00") },
        { id: "a3", name: "vendor_quote.xlsx", type: "xlsx", size: 89000, uploadedAt: new Date("2024-12-14T11:03:00") },
      ],
      activityLog: [
        { id: "l5", action: "created", user: "James Liu", timestamp: new Date("2024-12-14T11:00:00"), detail: "Voucher created" },
        { id: "l6", action: "attachment", user: "James Liu", timestamp: new Date("2024-12-14T11:02:00"), detail: "Attached 'license_agreement_2025.pdf'" },
        { id: "l7", action: "attachment", user: "James Liu", timestamp: new Date("2024-12-14T11:03:00"), detail: "Attached 'vendor_quote.xlsx'" },
        { id: "l8", action: "submitted", user: "James Liu", timestamp: new Date("2024-12-14T11:05:00"), detail: "Submitted for approval" },
      ],
      lineItems: [
        { description: "Figma Enterprise (25 seats)", quantity: 25, unitPrice: 180.00, total: 4500.00 },
        { description: "Slack Business+ (50 seats)", quantity: 50, unitPrice: 150.00, total: 7500.00 },
        { description: "1Password Teams (50 seats)", quantity: 50, unitPrice: 16.00, total: 800.00 },
      ],
    },
    {
      id: "3",
      number: "VOU-2024-003",
      description: "Travel Reimbursement — Client Visit NYC",
      amount: 3275.50,
      currency: "USD",
      status: "draft",
      createdBy: { name: "Emily Park", avatar: "EP" },
      createdAt: new Date("2024-12-15T08:30:00"),
      updatedAt: new Date("2024-12-15T08:30:00"),
      attachments: [],
      activityLog: [
        { id: "l9", action: "created", user: "Emily Park", timestamp: new Date("2024-12-15T08:30:00"), detail: "Voucher created" },
      ],
      lineItems: [
        { description: "Round-trip Airfare (SFO→JFK)", quantity: 1, unitPrice: 1450.00, total: 1450.00 },
        { description: "Hotel (3 nights)", quantity: 3, unitPrice: 425.50, total: 1276.50 },
        { description: "Ground Transportation", quantity: 1, unitPrice: 549.00, total: 549.00 },
      ],
    },
    {
      id: "4",
      number: "VOU-2024-004",
      description: "Marketing Campaign — Product Launch",
      amount: 28500.00,
      currency: "USD",
      status: "rejected",
      createdBy: { name: "David Kim", avatar: "DK" },
      createdAt: new Date("2024-12-12T15:00:00"),
      updatedAt: new Date("2024-12-13T10:15:00"),
      attachments: [
        { id: "a4", name: "campaign_proposal.pdf", type: "pdf", size: 3500000, uploadedAt: new Date("2024-12-12T15:05:00") },
      ],
      activityLog: [
        { id: "l10", action: "created", user: "David Kim", timestamp: new Date("2024-12-12T15:00:00"), detail: "Voucher created" },
        { id: "l11", action: "attachment", user: "David Kim", timestamp: new Date("2024-12-12T15:05:00"), detail: "Attached 'campaign_proposal.pdf'" },
        { id: "l12", action: "submitted", user: "David Kim", timestamp: new Date("2024-12-12T15:10:00"), detail: "Submitted for approval" },
        { id: "l13", action: "rejected", user: "Michael Torres", timestamp: new Date("2024-12-13T10:15:00"), detail: "Rejected — Budget exceeds quarterly allocation. Resubmit with revised scope." },
      ],
      lineItems: [
        { description: "Digital Ad Spend (Google + Meta)", quantity: 1, unitPrice: 15000.00, total: 15000.00 },
        { description: "Video Production", quantity: 1, unitPrice: 8500.00, total: 8500.00 },
        { description: "Influencer Partnerships", quantity: 1, unitPrice: 5000.00, total: 5000.00 },
      ],
    },
  ];
  counter = 4;
  return vouchers;
}
