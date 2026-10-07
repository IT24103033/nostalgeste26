import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Attendee from '../models/Attendee.js';
import { v4 as uuidv4 } from 'uuid';

const dataDir = path.resolve('data');
const jsonFilePath = path.join(dataDir, 'attendees.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(jsonFilePath)) {
  fs.writeFileSync(jsonFilePath, JSON.stringify([], null, 2), 'utf8');
}

// Helpers for File-based Storage fallback
const readLocalData = () => {
  try {
    const raw = fs.readFileSync(jsonFilePath, 'utf8');
    return JSON.parse(raw) || [];
  } catch (err) {
    console.error('Error reading local JSON db:', err);
    return [];
  }
};

const writeLocalData = (data) => {
  try {
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing local JSON db:', err);
  }
};

export const ensureDbConnection = async () => {
  if (mongoose.connection.readyState === 1) return true;
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      return true;
    } catch (err) {
      console.warn(`MongoDB connect attempt: ${err.message}`);
      return false;
    }
  }
  return false;
};

export const dbStore = {
  // Find Attendee by NIC or Student ID (Case-insensitive & resilient)
  async findByNic(nic) {
    if (!nic) return null;
    const cleanNic = nic.trim();
    const cleanUpper = cleanNic.toUpperCase();
    const connected = await ensureDbConnection();

    if (connected) {
      const escaped = cleanNic.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const regex = new RegExp(`^${escaped}$`, 'i');
      return await Attendee.findOne({
        $or: [{ nic: regex }, { studentId: regex }],
      });
    } else {
      const list = readLocalData();
      return (
        list.find(
          (a) =>
            (a.nic && a.nic.trim().toUpperCase() === cleanUpper) ||
            (a.studentId && a.studentId.trim().toUpperCase() === cleanUpper)
        ) || null
      );
    }
  },

  // Find Attendee by QR Token
  async findByQrToken(qrToken) {
    const token = qrToken.trim();
    const connected = await ensureDbConnection();

    if (connected) {
      return await Attendee.findOne({ qrToken: token });
    } else {
      const list = readLocalData();
      return list.find((a) => a.qrToken === token) || null;
    }
  },

  // Find Attendee by ID
  async findById(id) {
    const connected = await ensureDbConnection();
    if (connected) {
      try {
        return await Attendee.findById(id);
      } catch (e) {
        return await Attendee.findOne({
          $or: [{ nic: id }, { studentId: id }, { qrToken: id }],
        });
      }
    } else {
      const list = readLocalData();
      return list.find((a) => a._id === id || a.id === id) || null;
    }
  },

  // Create new Attendee
  async create(data) {
    const defaultToken =
      uuidv4().replace(/-/g, '') + Math.random().toString(36).substring(2, 8).toUpperCase();
    const cleanNic = (data.nic || data.studentId || '').trim().toUpperCase();
    const cleanClass = (data.studentClass || data.batch || '').trim().toUpperCase();

    const docData = {
      nic: cleanNic,
      studentId: cleanNic,
      name: data.name?.trim(),
      email: data.email?.trim().toLowerCase(),
      phone: data.phone?.trim(),
      studentClass: cleanClass,
      paymentChoice: data.paymentChoice || 'FULL',
      paymentStatus: data.paymentStatus || 'PENDING_FIRST_HALF',
      amountPaid: data.amountPaid || 0,
      receipts: data.receipts || [],
      qrToken: defaultToken,
      ticketUsed: false,
      checkedInAt: null,
      wristbandNumber: '',
      rejectionReason: null,
      emailSent: false,
      emailSentAt: null,
      notes: '',
    };

    const connected = await ensureDbConnection();

    if (connected) {
      const attendee = new Attendee(docData);
      const saved = await attendee.save();
      return saved.toObject();
    } else {
      const list = readLocalData();
      const localDoc = {
        _id: new mongoose.Types.ObjectId().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...docData,
      };
      const filtered = list.filter((a) => (a.nic || a.studentId) !== cleanNic);
      filtered.unshift(localDoc);
      writeLocalData(filtered);
      return localDoc;
    }
  },

  // Update Attendee
  async update(id, updates) {
    const connected = await ensureDbConnection();

    if (connected) {
      return await Attendee.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      );
    } else {
      const list = readLocalData();
      const index = list.findIndex((a) => a._id === id || a.id === id);
      if (index === -1) return null;

      list[index] = {
        ...list[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      writeLocalData(list);
      return list[index];
    }
  },

  // Delete Attendee
  async delete(id) {
    const connected = await ensureDbConnection();
    if (connected) {
      return await Attendee.findByIdAndDelete(id);
    } else {
      let list = readLocalData();
      const initialLen = list.length;
      list = list.filter((a) => a._id !== id && a.id !== id && a.nic !== id && a.studentId !== id);
      writeLocalData(list);
      return list.length < initialLen;
    }
  },

  // Get all attendees with filter, search, sort
  async getAll({ search, status, studentClass, ticketUsed, sortBy = 'createdAt', sortOrder = 'desc' } = {}) {
    const connected = await ensureDbConnection();

    if (connected) {
      const filter = {};
      if (status && status !== 'ALL') filter.paymentStatus = status;
      if (studentClass && studentClass !== 'ALL') {
        filter.$or = [{ studentClass }, { batch: studentClass }];
      }
      if (ticketUsed !== undefined && ticketUsed !== 'ALL') filter.ticketUsed = ticketUsed === 'true';

      if (search && search.trim() !== '') {
        const regex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { nic: regex },
          { studentId: regex },
          { name: regex },
          { email: regex },
          { phone: regex },
          { studentClass: regex },
          { wristbandNumber: regex },
        ];
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
      return await Attendee.find(filter).sort(sortOptions).lean();
    } else {
      let list = readLocalData();

      if (status && status !== 'ALL') {
        list = list.filter((a) => a.paymentStatus === status);
      }

      if (studentClass && studentClass !== 'ALL') {
        list = list.filter((a) => (a.studentClass || a.batch) === studentClass);
      }

      if (ticketUsed !== undefined && ticketUsed !== 'ALL') {
        const isUsed = ticketUsed === 'true';
        list = list.filter((a) => !!a.ticketUsed === isUsed);
      }

      if (search && search.trim() !== '') {
        const q = search.trim().toLowerCase();
        list = list.filter(
          (a) =>
            a.nic?.toLowerCase().includes(q) ||
            a.studentId?.toLowerCase().includes(q) ||
            a.name?.toLowerCase().includes(q) ||
            a.email?.toLowerCase().includes(q) ||
            a.phone?.toLowerCase().includes(q) ||
            (a.studentClass || a.batch)?.toLowerCase().includes(q) ||
            a.wristbandNumber?.toLowerCase().includes(q)
        );
      }

      list.sort((a, b) => {
        const valA = a[sortBy] || '';
        const valB = b[sortBy] || '';
        if (sortOrder === 'asc') return valA > valB ? 1 : -1;
        return valA < valB ? 1 : -1;
      });

      return list;
    }
  },

  // Metrics
  async getMetrics() {
    const connected = await ensureDbConnection();
    const list = connected ? await Attendee.find().lean() : readLocalData();

    const total = list.length;
    const fullApproved = list.filter((a) => a.paymentStatus === 'FULL_APPROVED').length;
    const halfApproved = list.filter((a) => a.paymentStatus === 'HALF_APPROVED').length;
    const pendingFirstHalf = list.filter((a) => a.paymentStatus === 'PENDING_FIRST_HALF').length;
    const pendingSecondHalf = list.filter((a) => a.paymentStatus === 'PENDING_SECOND_HALF').length;
    const rejected = list.filter((a) => a.paymentStatus === 'REJECTED').length;
    const checkedIn = list.filter((a) => !!a.ticketUsed).length;

    const classCounts = {};
    list.forEach((item) => {
      const cls = item.studentClass || item.batch || 'Unassigned';
      classCounts[cls] = (classCounts[cls] || 0) + 1;
    });

    const totalRevenue = list.reduce((sum, item) => {
      if (item.paymentStatus === 'FULL_APPROVED' || item.paymentStatus === 'HALF_APPROVED') {
        return sum + (Number(item.amountPaid) || 0);
      }
      return sum;
    }, 0);

    return {
      total,
      fullApproved,
      halfApproved,
      pendingFirstHalf,
      pendingSecondHalf,
      pendingTotal: pendingFirstHalf + pendingSecondHalf,
      rejected,
      checkedIn,
      totalRevenue,
      classCounts,
      dbMode: connected ? 'MongoDB Atlas' : 'Local Persistent Storage',
    };
  },
};
