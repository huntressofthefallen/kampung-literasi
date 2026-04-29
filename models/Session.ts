import mongoose, { Schema, Model } from 'mongoose';

export interface ISession {
  _id?: mongoose.Types.ObjectId;
  name: string;
  date: Date;
  time: string;
  limit: number;
  currentRegistrations: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

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
    currentRegistrations: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Session: Model<ISession> =
  mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);

export default Session;
