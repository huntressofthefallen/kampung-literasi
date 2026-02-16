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

// Removed unique index to allow multiple students to register with same phone number and session

const Registration: Model<IRegistration> =
  mongoose.models.Registration ||
  mongoose.model<IRegistration>('Registration', RegistrationSchema);

export default Registration;
