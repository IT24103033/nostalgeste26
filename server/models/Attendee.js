import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const receiptSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    default: '',
  },
  paymentType: {
    type: String,
    enum: ['FIRST_HALF', 'SECOND_HALF', 'FULL'],
    required: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
  originalFilename: {
    type: String,
    default: '',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const attendeeSchema = new mongoose.Schema(
  {
    nic: {
      type: String,
      required: [true, 'NIC Number is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    // Keep studentId synced with nic for any legacy references
    studentId: {
      type: String,
      uppercase: true,
      trim: true,
      default: function () {
        return this.nic;
      },
    },
    name: {
      type: String,
      required: [true, 'Student Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: false,
      default: '',
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    studentClass: {
      type: String,
      required: [true, 'Class is required (e.g. 13-C, 12-A)'],
      trim: true,
      uppercase: true,
    },
    paymentStatus: {
      type: String,
      enum: [
        'PENDING_FIRST_HALF',
        'HALF_APPROVED',
        'PENDING_SECOND_HALF',
        'FULL_APPROVED',
        'REJECTED',
      ],
      default: 'PENDING_FIRST_HALF',
      index: true,
    },
    paymentChoice: {
      type: String,
      enum: ['HALF', 'FULL'],
      default: 'FULL',
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    receipts: [receiptSchema],
    qrToken: {
      type: String,
      unique: true,
      index: true,
      default: () => uuidv4().replace(/-/g, '') + Math.random().toString(36).substring(2, 8).toUpperCase(),
    },
    ticketUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    wristbandNumber: {
      type: String,
      default: '',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const Attendee = mongoose.model('Attendee', attendeeSchema);
export default Attendee;
