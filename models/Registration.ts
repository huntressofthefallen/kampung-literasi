import mongoose, { Schema, Model } from 'mongoose';

export interface IRegistration {
  _id?: mongoose.Types.ObjectId;
  fullName: string;
  phoneNumber: string;
  grade: string;
  sessionId: mongoose.Types.ObjectId;
  sessionName?: string;
  sessionDate?: Date;
  sessionTime?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const RegistrationSchema = new Schema<IRegistration>(
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
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: [true, 'Session is required'],
    },
  },
  {
    timestamps: true,
  }
);

// No unique indexes — multiple students may share the same phone number and session.
// syncIndexes() is called after model creation to drop any stale unique indexes
// that may still exist in MongoDB from a previous schema version.

const Registration: Model<IRegistration> =
  mongoose.models.Registration ||
  mongoose.model<IRegistration>('Registration', RegistrationSchema);

// Drop stale indexes from the DB so they match the current schema.
// This is a no-op if indexes are already in sync.
Registration.syncIndexes().catch((err) =>
  console.warn('[Registration] syncIndexes warning:', err)
);

export default Registration;
