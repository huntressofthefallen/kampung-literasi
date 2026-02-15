import mongoose, { Schema, Model } from 'mongoose';

export interface IRegistration {
  _id?: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phoneNumber: string;
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
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
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

// Create a unique index to ensure one person can only register for one session
// Note: This prevents re-registration even if the person deletes their registration
// If this behavior is not desired, consider using a compound index on fullName and sessionId
RegistrationSchema.index({ fullName: 1 }, { unique: true });

const Registration: Model<IRegistration> =
  mongoose.models.Registration ||
  mongoose.model<IRegistration>('Registration', RegistrationSchema);

export default Registration;
