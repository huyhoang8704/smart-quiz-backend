const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Full name is required'],
            minlength: [3, 'Full name must be at least 3 characters long'],
            maxlength: [50, 'Full name must be at most 50 characters long'],
            trim: true
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            match: [/\S+@\S+\.\S+/, 'Please use a valid email address']
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [3, 'Password must be at least 6 characters long']
        },
        phone: {
            type: String,
            match: [/^\d{10,15}$/, 'Phone number must contain only digits and be between 10 to 15 characters long']
        },
        role: {
            type: String,
            enum: ['teacher', 'student', 'admin'],
            default: 'student'
        },
    },
    {
        timestamps: true
    }
);



// Mã hóa password trước khi lưu
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});


// So sánh mật khẩu
userSchema.methods.comparePassword = function(candidate) {
    return bcrypt.compare(candidate, this.password);
};


module.exports = mongoose.model('User', userSchema, 'users');