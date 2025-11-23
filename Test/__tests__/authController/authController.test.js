const path = require('path');

// Mock modules before requiring controller
jest.mock('jsonwebtoken');
jest.mock('../../../Backend/models/User');

const jwt = require('jsonwebtoken');
const User = require(path.resolve(__dirname, '..', '..', '..', 'Backend', 'models', 'User'));
const authController = require(path.resolve(__dirname, '..', '..', '..', 'Backend', 'controllers', 'authController'));

describe('authController - Basic Functionality', () => {
    let req, res, next;

    // Standardize test logging: concise PASS/FAIL per test
    const _origTest = global.test;
    global.test = (name, fn, timeout) => {
        _origTest(name, async () => {
            try {
                await fn();
                console.log(`✅ PASS: ${name}`);
            } catch (err) {
                console.log(`❌ FAIL: ${name} - ${err.message}`);
                throw err;
            }
        }, timeout);
    };

    beforeEach(() => {
        req = {
            body: {},
            user: null,
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis(),
        };
        next = jest.fn();

        // Reset mocks
        jest.clearAllMocks();

        // Default JWT mock
        jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');
    });

    describe('registerStudent - Student Registration', () => {
        // Description: successfully registers a new student
        test('successfully registers a new student', async () => {
            req.body = { name: 'John', email: 'john@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'user123',
                name: 'John',
                email: 'john@test.com',
                role: 'student',
            });

            await authController.registerStudent(req, res, next);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'john@test.com' });
            expect(User.create).toHaveBeenCalledWith({
                name: 'John',
                email: 'john@test.com',
                password: 'pass123',
                role: 'student',
            });
            expect(res.json).toHaveBeenCalledWith({
                token: 'mock-jwt-token',
                user: {
                    id: 'user123',
                    name: 'John',
                    email: 'john@test.com',
                    role: 'student',
                },
            });
        });

        // Description: returns 400 if name is missing
        test('returns 400 if name is missing', async () => {
            req.body = { email: 'john@test.com', password: 'pass123' };

            await authController.registerStudent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Please provide name, email and password',
            });
        });

        // Description: returns 400 if email is missing
        test('returns 400 if email is missing', async () => {
            req.body = { name: 'John', password: 'pass123' };

            await authController.registerStudent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Please provide name, email and password',
            });
        });

        // Description: returns 400 if password is missing
        test('returns 400 if password is missing', async () => {
            req.body = { name: 'John', email: 'john@test.com' };

            await authController.registerStudent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Please provide name, email and password',
            });
        });

        // Description: returns 400 if email already exists
        test('returns 400 if email already exists', async () => {
            req.body = { name: 'John', email: 'existing@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue({ email: 'existing@test.com' });

            await authController.registerStudent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Email already registered' });
        });

        // Description: signs JWT token with correct payload
        test('signs JWT token with correct payload', async () => {
            req.body = { name: 'John', email: 'john@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'user123',
                name: 'John',
                email: 'john@test.com',
                role: 'student',
            });

            await authController.registerStudent(req, res, next);

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: 'user123', role: 'student' },
                expect.any(String),
                expect.any(Object)
            );
        });
    });

    describe('registerTeacher - Teacher Registration', () => {
        // Description: successfully registers a new teacher
        test('successfully registers a new teacher', async () => {
            req.body = { name: 'Alice', email: 'alice@test.com', password: 'teach123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'teacher123',
                name: 'Alice',
                email: 'alice@test.com',
                role: 'teacher',
            });

            await authController.registerTeacher(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                token: 'mock-jwt-token',
                user: {
                    _id: 'teacher123',
                    name: 'Alice',
                    email: 'alice@test.com',
                    role: 'teacher',
                },
            });
        });

        // Description: returns 400 if email already exists (teacher)
        test('returns 400 if email already exists', async () => {
            req.body = { name: 'Alice', email: 'existing@test.com', password: 'teach123' };

            User.findOne = jest.fn().mockResolvedValue({ email: 'existing@test.com' });

            await authController.registerTeacher(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Email already exists' });
        });

        // Description: returns 500 on database error (teacher)
        test('returns 500 on database error', async () => {
            req.body = { name: 'Alice', email: 'alice@test.com', password: 'teach123' };

            User.findOne = jest.fn().mockRejectedValue(new Error('DB connection failed'));

            await authController.registerTeacher(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB connection failed' });
        });
    });

    describe('registerAdmin - Admin Registration', () => {
        // Description: successfully registers a new admin
        test('successfully registers a new admin', async () => {
            req.body = { name: 'Admin', email: 'admin@test.com', password: 'admin123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'admin123',
                name: 'Admin',
                email: 'admin@test.com',
                role: 'admin',
            });

            await authController.registerAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                token: 'mock-jwt-token',
                user: {
                    _id: 'admin123',
                    name: 'Admin',
                    email: 'admin@test.com',
                    role: 'admin',
                },
            });
        });

        // Description: returns 400 if email already exists (admin)
        test('returns 400 if email already exists', async () => {
            req.body = { name: 'Admin', email: 'existing@test.com', password: 'admin123' };

            User.findOne = jest.fn().mockResolvedValue({ email: 'existing@test.com' });

            await authController.registerAdmin(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Email already exists' });
        });

        // Description: creates user with admin role
        test('creates user with admin role', async () => {
            req.body = { name: 'Admin', email: 'admin@test.com', password: 'admin123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'admin123',
                name: 'Admin',
                email: 'admin@test.com',
                role: 'admin',
            });

            await authController.registerAdmin(req, res);

            expect(User.create).toHaveBeenCalledWith({
                name: 'Admin',
                email: 'admin@test.com',
                password: 'admin123',
                role: 'admin',
            });
        });
    });

    describe('login - User Authentication', () => {
        // Description: successfully logs in with valid credentials
        test('successfully logs in with valid credentials', async () => {
            req.body = { email: 'john@test.com', password: 'pass123' };

            const mockUser = {
                _id: 'user123',
                name: 'John',
                email: 'john@test.com',
                role: 'student',
                comparePassword: jest.fn().mockResolvedValue(true),
            };

            User.findOne = jest.fn().mockResolvedValue(mockUser);

            await authController.login(req, res, next);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'john@test.com' });
            expect(mockUser.comparePassword).toHaveBeenCalledWith('pass123');
            expect(res.json).toHaveBeenCalledWith({
                token: 'mock-jwt-token',
                user: {
                    id: 'user123',
                    name: 'John',
                    email: 'john@test.com',
                    role: 'student',
                },
            });
        });

        // Description: returns 400 if user not found
        test('returns 400 if user not found', async () => {
            req.body = { email: 'notfound@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue(null);

            await authController.login(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
        });

        // Description: returns 400 if password is incorrect
        test('returns 400 if password is incorrect', async () => {
            req.body = { email: 'john@test.com', password: 'wrongpass' };

            const mockUser = {
                _id: 'user123',
                email: 'john@test.com',
                comparePassword: jest.fn().mockResolvedValue(false),
            };

            User.findOne = jest.fn().mockResolvedValue(mockUser);

            await authController.login(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
        });

        // Description: calls comparePassword method on user
        test('calls comparePassword method on user', async () => {
            req.body = { email: 'john@test.com', password: 'pass123' };

            const mockUser = {
                _id: 'user123',
                name: 'John',
                email: 'john@test.com',
                role: 'student',
                comparePassword: jest.fn().mockResolvedValue(true),
            };

            User.findOne = jest.fn().mockResolvedValue(mockUser);

            await authController.login(req, res, next);

            expect(mockUser.comparePassword).toHaveBeenCalledWith('pass123');
        });

        // Description: signs JWT token on successful login
        test('signs JWT token on successful login', async () => {
            req.body = { email: 'john@test.com', password: 'pass123' };

            const mockUser = {
                _id: 'user123',
                name: 'John',
                email: 'john@test.com',
                role: 'student',
                comparePassword: jest.fn().mockResolvedValue(true),
            };

            User.findOne = jest.fn().mockResolvedValue(mockUser);

            await authController.login(req, res, next);

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: 'user123', role: 'student' },
                expect.any(String),
                expect.any(Object)
            );
        });
    });

    describe('me - Get Current User', () => {
        // Description: returns current user from request
        test('returns current user from request', async () => {
            req.user = {
                id: 'user123',
                name: 'John',
                email: 'john@test.com',
                role: 'student',
            };

            await authController.me(req, res);

            expect(res.json).toHaveBeenCalledWith({
                user: {
                    id: 'user123',
                    name: 'John',
                    email: 'john@test.com',
                    role: 'student',
                },
            });
        });

        // Description: returns null if no user in request
        test('returns null if no user in request', async () => {
            req.user = null;

            await authController.me(req, res);

            expect(res.json).toHaveBeenCalledWith({ user: null });
        });
    });

    describe('Error Handling', () => {
        // Description: registerStudent calls next on unhandled error
        test('registerStudent calls next on unhandled error', async () => {
            req.body = { name: 'John', email: 'john@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

            await authController.registerStudent(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        // Description: login calls next on unhandled error
        test('login calls next on unhandled error', async () => {
            req.body = { email: 'john@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockRejectedValue(new Error('DB error'));

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });
});
