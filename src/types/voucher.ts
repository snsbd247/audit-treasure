export type VoucherStatus = "draft" | "pending" | "approved" | "rejected";

export interface VoucherUser {
  name: string;
  avatar: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  user: string;
  timestamp: Date;
  detail: string;
}

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Voucher {
  id: string;
  number: string;
  description: string;
  amount: number;
  currency: string;
  status: VoucherStatus;
  createdBy: VoucherUser;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: VoucherUser;
  attachments: Attachment[];
  activityLog: ActivityLogEntry[];
  lineItems: LineItem[];
}
