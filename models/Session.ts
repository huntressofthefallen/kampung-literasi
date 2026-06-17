import mongoose, { Schema, Model } from 'mongoose';

export interface IRegistrationEntry {
  _id?: mongoose.Types.ObjectId;
  fullName: string;
  phoneNumber: string;
  grade: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ISession {
  _id?: mongoose.Types.ObjectId;
  name: string;
  date: Date;
  time: string;
  limit: number;
  isActive: boolean;
  registrations: IRegistrationEntry[];
  createdAt?: Date;
  updatedAt?: Date;
}

const RegistrationEntrySchema = new Schema<IRegistrationEntry>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    grade: {
      type: String,
      required: [true, 'Grade is required'],
      enum: ['SD 1', 'SD 2', 'SD 3', 'SD 4', 'SD 5', 'SD 6'],
    },
  },
  { timestamps: true }
);

const SessionSchema = new Schema<ISession>(
  {
    name: {
      type: String,
      required: [true, 'Session name is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Session date is required'],
    },
    time: {
      type: String,
      required: [true, 'Session time is required'],
    },
    limit: {
      type: Number,
      required: [true, 'Session limit is required'],
      min: [1, 'Limit must be at least 1'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    registrations: {
      type: [RegistrationEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);

export default Session;
