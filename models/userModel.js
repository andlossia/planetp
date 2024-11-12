const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');
const Roles = require('../utils/userType');

const roleNames = Object.values(Roles).map(role => role.name);

const applyToJSON = require('../middlewares/applyToJson');

const userSchema = new Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true, match: /.+\@.+\..+/ },
  roles: {
    type: [String],
    enum: roleNames,
    default: Roles.User.name 
  },
  courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
  certificates: [{ type: Schema.Types.ObjectId, ref: 'Certificate' }],
  dog: [{ type: Schema.Types.ObjectId, ref: 'Dog' }],
  profilePicture: { type: Schema.Types.ObjectId, ref: 'Media' },

  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  contactDetails: {
    phoneNumber: { type: String },
    socialMedia: {
      facebook: { type: String },
      twitter: { type: String },
      instagram: { type: String },
      linkedIn: { type: String },
      whatsapp: { type: String }
    },
  },


}, { timestamps: true });

const isDevelopment = process.env.NODE_ENV === 'development';

userSchema.pre('save', async function (next) {
  if (this.isAdmin && !isDevelopment) {
    return next(new Error('Creating admin users is not allowed in production mode'));
  }

  if (this.isModified('password')) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }

  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

applyToJSON(userSchema);

module.exports = mongoose.model('User', userSchema);
