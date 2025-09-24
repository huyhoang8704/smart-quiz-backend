const jwt = require('jsonwebtoken');
const User = require('../models/User');


// Hàm tạo JWT
function signToken(user) {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'your_jwt_secret_here',
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
}


// Đăng ký (student)
const registerStudent = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ error: 'Please provide name, email and password' });
        // Check email trùng
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ error: 'Email already registered' });

        // Tạo user với role student
        const user = await User.create({ name, email, password, role: 'student' });
        const token = signToken(user);

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) { next(err); }
};
// Đăng ký (teacher)
const registerTeacher = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already exists' });
        const user = await User.create({ name, email, password, role: 'teacher' });

        res.status(201).json({ token: signToken(user), user });
    } catch (err) {
            res.status(500).json({ error: err.message });
    }
};
// Đăng ký (admin)
const registerAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existing = await User.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Email already exists' });
        const user = await User.create({ name, email, password, role: 'admin' });

        res.status(201).json({ token: signToken(user), user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Đăng nhập
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });


        if (!user) return res.status(400).json({ error: 'Invalid credentials' });


        const match = await user.comparePassword(password);
        if (!match) return res.status(400).json({ error: 'Invalid credentials' });

        const token = signToken(user);

        res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) { next(err); }
};


// Lấy thông tin cá nhân (me)
const me = async (req, res) => {
    res.json({ user: req.user });
};

module.exports = { 
    registerStudent, 
    login, 
    me,
    registerTeacher,
    registerAdmin, 
};