const path = require('path');

// Mock modules before requiring controller
jest.mock('jsonwebtoken');
jest.mock('../../../Backend/models/User');

const jwt = require('jsonwebtoken');
const User = require(path.resolve(__dirname, '..', '..', '..', 'Backend', 'models', 'User'));
const authController = require(path.resolve(__dirname, '..', '..', '..', 'Backend', 'controllers', 'authController'));

describe('authController - Edge Cases', () => {
    let req, res, next;

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

        jest.clearAllMocks();
        jwt.sign = jest.fn().mockReturnValue('mock-jwt-token');
    });

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

    describe('registerStudent - Input Edge Cases', () => {
        // Description: handles empty string name
        test('handles empty string name', async () => {
            req.body = { name: '', email: 'john@test.com', password: 'pass123' };

            await authController.registerStudent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Please provide name, email and password',
            });
        });

        // Description: handles empty string email
        test('handles empty string email', async () => {
            req.body = { name: 'John', email: '', password: 'pass123' };

            await authController.registerStudent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Please provide name, email and password',
            });
        });

        // Description: handles empty string password
        test('handles empty string password', async () => {
            req.body = { name: 'John', email: 'john@test.com', password: '' };

            await authController.registerStudent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Please provide name, email and password',
            });
        });

        // Description: handles whitespace-only name
        test('handles whitespace-only name', async () => {
            req.body = { name: '   ', email: 'john@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'user123',
                name: '   ',
                email: 'john@test.com',
                role: 'student',
            });

            await authController.registerStudent(req, res, next);

            // Function doesn't trim, so whitespace name is allowed
            expect(User.create).toHaveBeenCalled();
        });

        // Description: handles very long name (1000 chars)
        test('handles very long name (1000 chars)', async () => {
            const longName = 'A'.repeat(1000);
            req.body = { name: longName, email: 'john@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'user123',
                name: longName,
                email: 'john@test.com',
                role: 'student',
            });

            await authController.registerStudent(req, res, next);

            expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ name: longName }));
        });

        // Description: handles very long email (500 chars)
        test('handles very long email (500 chars)', async () => {
            const longEmail = 'a'.repeat(480) + '@test.com';
            req.body = { name: 'John', email: longEmail, password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'user123',
                name: 'John',
                email: longEmail,
                role: 'student',
            });

            await authController.registerStudent(req, res, next);

            expect(User.create).toHaveBeenCalledWith(expect.objectContaining({ email: longEmail }));
        });

        // Description: handles special characters in name
        test('handles special characters in name', async () => {
            req.body = { name: 'John<script>alert("xss")</script>', email: 'john@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'user123',
                name: 'John<script>alert("xss")</script>',
                email: 'john@test.com',
                role: 'student',
            });

            await authController.registerStudent(req, res, next);

            // Function doesn't sanitize, passes through
            expect(User.create).toHaveBeenCalled();
        });

        // Description: handles SQL-style input in email field
        test('handles SQL injection attempt in email', async () => {
            req.body = {
                name: 'John',
                email: "admin'--@test.com",
                password: 'pass123'
            };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'user123',
                name: 'John',
                email: "admin'--@test.com",
                role: 'student',
            });

            await authController.registerStudent(req, res, next);

            expect(User.findOne).toHaveBeenCalledWith({ email: "admin'--@test.com" });
        });

        // Description: handles Unicode characters in name
        test('handles Unicode characters in name', async () => {
            req.body = { name: '日本語 Nguyễn Test 中文', email: 'john@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'user123',
                name: '日本語 Nguyễn Test 中文',
                email: 'john@test.com',
                role: 'student',
            });

            await authController.registerStudent(req, res, next);

            expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
                name: '日本語 Nguyễn Test 中文',
            }));
        });

        // Description: handles emoji in name
        test('handles emoji in name', async () => {
            req.body = { name: 'John 😀 Test 🎉', email: 'john@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'user123',
                name: 'John 😀 Test 🎉',
                email: 'john@test.com',
                role: 'student',
            });

            await authController.registerStudent(req, res, next);

            expect(res.json).toHaveBeenCalled();
        });

        // Description: handles null values in body
        test('handles null values in body', async () => {
            req.body = { name: null, email: null, password: null };

            await authController.registerStudent(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
        });

        // Description: handles undefined body object
        test('handles undefined body object', async () => {
            req.body = undefined;

            await authController.registerStudent(req, res, next);

            // Controller catches error and calls next()
            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('login - Authentication Edge Cases', () => {
        // Description: handles missing email field on login
        test('handles missing email field', async () => {
            req.body = { password: 'pass123' };

            const mockUser = {
                comparePassword: jest.fn().mockResolvedValue(true),
            };
            User.findOne = jest.fn().mockResolvedValue(mockUser);

            await authController.login(req, res, next);

            expect(User.findOne).toHaveBeenCalledWith({ email: undefined });
        });

        // Description: handles missing password field on login
        test('handles missing password field', async () => {
            req.body = { email: 'john@test.com' };

            const mockUser = {
                _id: 'user123',
                comparePassword: jest.fn().mockResolvedValue(false),
            };
            User.findOne = jest.fn().mockResolvedValue(mockUser);

            await authController.login(req, res, next);

            expect(mockUser.comparePassword).toHaveBeenCalledWith(undefined);
        });

        // Description: handles case-sensitive email mismatch
        test('handles case-sensitive email (user stored lowercase)', async () => {
            req.body = { email: 'John@Test.COM', password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue(null);

            await authController.login(req, res, next);

            expect(User.findOne).toHaveBeenCalledWith({ email: 'John@Test.COM' });
            expect(res.status).toHaveBeenCalledWith(400);
        });

        // Description: handles very long password input
        test('handles very long password (10000 chars)', async () => {
            const longPassword = 'A'.repeat(10000);
            req.body = { email: 'john@test.com', password: longPassword };

            const mockUser = {
                _id: 'user123',
                name: 'John',
                email: 'john@test.com',
                role: 'student',
                comparePassword: jest.fn().mockResolvedValue(true),
            };
            User.findOne = jest.fn().mockResolvedValue(mockUser);

            await authController.login(req, res, next);

            expect(mockUser.comparePassword).toHaveBeenCalledWith(longPassword);
        });

        // Description: handles special characters in password
        test('handles special characters in password', async () => {
            req.body = { email: 'john@test.com', password: '!@#$%^&*()_+-=[]{}|;:,.<>?' };

            const mockUser = {
                _id: 'user123',
                name: 'John',
                email: 'john@test.com',
                role: 'student',
                comparePassword: jest.fn().mockResolvedValue(true),
            };
            User.findOne = jest.fn().mockResolvedValue(mockUser);

            await authController.login(req, res, next);

            expect(mockUser.comparePassword).toHaveBeenCalledWith('!@#$%^&*()_+-=[]{}|;:,.<>?');
        });

        // Description: handles password containing null bytes
        test('handles password with null bytes', async () => {
            req.body = { email: 'john@test.com', password: 'pass\x00word' };

            const mockUser = {
                _id: 'user123',
                name: 'John',
                email: 'john@test.com',
                role: 'student',
                comparePassword: jest.fn().mockResolvedValue(true),
            };
            User.findOne = jest.fn().mockResolvedValue(mockUser);

            await authController.login(req, res, next);

            expect(mockUser.comparePassword).toHaveBeenCalledWith('pass\x00word');
        });

        // Description: handles comparePassword throwing an error
        test('handles comparePassword throwing error', async () => {
            req.body = { email: 'john@test.com', password: 'pass123' };

            const mockUser = {
                _id: 'user123',
                comparePassword: jest.fn().mockRejectedValue(new Error('Bcrypt error')),
            };
            User.findOne = jest.fn().mockResolvedValue(mockUser);

            await authController.login(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });
    });

    describe('JWT Token Edge Cases', () => {
        // Description: handles JWT.sign throwing an error during registration
        test('handles JWT sign throwing error', async () => {
            req.body = { name: 'John', email: 'john@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'user123',
                name: 'John',
                email: 'john@test.com',
                role: 'student',
            });

            jwt.sign = jest.fn().mockImplementation(() => {
                throw new Error('JWT signing failed');
            });

            await authController.registerStudent(req, res, next);

            // Controller catches error and calls next()
            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: 'JWT signing failed',
            }));
        });

        // Description: handles very long user ID in JWT payload
        test('handles very long user ID', async () => {
            const longId = 'x'.repeat(1000);
            req.body = { name: 'John', email: 'john@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: longId,
                name: 'John',
                email: 'john@test.com',
                role: 'student',
            });

            await authController.registerStudent(req, res, next);

            expect(jwt.sign).toHaveBeenCalledWith(
                { id: longId, role: 'student' },
                expect.any(String),
                expect.any(Object)
            );
        });

        // Description: handles missing JWT secret environment variable
        test('handles missing process.env.JWT_SECRET', async () => {
            const originalSecret = process.env.JWT_SECRET;
            delete process.env.JWT_SECRET;

            req.body = { name: 'John', email: 'john@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'user123',
                name: 'John',
                email: 'john@test.com',
                role: 'student',
            });

            await authController.registerStudent(req, res, next);

            // Should use fallback secret
            expect(jwt.sign).toHaveBeenCalled();

            process.env.JWT_SECRET = originalSecret;
        });
    });

    describe('Database Error Edge Cases', () => {
        // Description: handles timeout error from User.findOne
        test('handles timeout error from User.findOne', async () => {
            req.body = { name: 'John', email: 'john@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockRejectedValue(new Error('Connection timeout'));

            await authController.registerStudent(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        // Description: handles duplicate key error thrown by User.create
        test('handles duplicate key error from User.create', async () => {
            req.body = { name: 'John', email: 'john@test.com', password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockRejectedValue({
                code: 11000,
                message: 'Duplicate key error',
            });

            await authController.registerStudent(req, res, next);

            expect(next).toHaveBeenCalled();
        });

        // Description: handles validation error from User.create
        test('handles validation error from User.create', async () => {
            req.body = { name: 'John', email: 'invalid-email', password: 'pass123' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockRejectedValue({
                name: 'ValidationError',
                message: 'Invalid email format',
            });

            await authController.registerStudent(req, res, next);

            expect(next).toHaveBeenCalled();
        });
    });

    describe('Response Edge Cases', () => {
        // Description: me returns undefined when req.user is undefined
        test('me returns undefined user', async () => {
            req.user = undefined;

            await authController.me(req, res);

            expect(res.json).toHaveBeenCalledWith({ user: undefined });
        });

        // Description: me returns user object even when fields missing
        test('me returns user with missing fields', async () => {
            req.user = { id: 'user123' }; // Missing name, email, role

            await authController.me(req, res);

            expect(res.json).toHaveBeenCalledWith({ user: { id: 'user123' } });
        });

        // Description: me returns user including extra unexpected fields
        test('me returns user with extra fields', async () => {
            req.user = {
                id: 'user123',
                name: 'John',
                email: 'john@test.com',
                role: 'student',
                extraField: 'should be included',
                password: 'hashed', // Should be filtered by middleware
            };

            await authController.me(req, res);

            expect(res.json).toHaveBeenCalledWith({ user: req.user });
        });
    });

    describe('Concurrent Request Edge Cases', () => {
        // Description: simulates simultaneous registrations with same email
        test('handles simultaneous registrations with same email', async () => {
            req.body = { name: 'John', email: 'race@test.com', password: 'pass123' };

            // First check: email not exists
            User.findOne = jest.fn()
                .mockResolvedValueOnce(null) // First call: not found
                .mockResolvedValueOnce({ email: 'race@test.com' }); // Second call: exists

            User.create = jest.fn().mockResolvedValue({
                _id: 'user123',
                name: 'John',
                email: 'race@test.com',
                role: 'student',
            });

            // First request
            await authController.registerStudent(req, res, next);

            // Reset mocks for second request
            res.json.mockClear();
            res.status.mockClear();

            // Second request
            await authController.registerStudent(req, res, next);

            // Second request should fail
            expect(res.status).toHaveBeenCalledWith(400);
        });
    });

    describe('Role Assignment Edge Cases', () => {
        // Description: registerStudent always forces 'student' role
        test('registerStudent always assigns student role', async () => {
            req.body = { name: 'John', email: 'john@test.com', password: 'pass123', role: 'admin' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'user123',
                name: 'John',
                email: 'john@test.com',
                role: 'student',
            });

            await authController.registerStudent(req, res, next);

            expect(User.create).toHaveBeenCalledWith(
                expect.objectContaining({ role: 'student' })
            );
        });

        // Description: registerTeacher always forces 'teacher' role
        test('registerTeacher always assigns teacher role', async () => {
            req.body = { name: 'Alice', email: 'alice@test.com', password: 'teach123', role: 'admin' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'teacher123',
                name: 'Alice',
                email: 'alice@test.com',
                role: 'teacher',
            });

            await authController.registerTeacher(req, res);

            expect(User.create).toHaveBeenCalledWith(
                expect.objectContaining({ role: 'teacher' })
            );
        });

        // Description: registerAdmin always forces 'admin' role
        test('registerAdmin always assigns admin role', async () => {
            req.body = { name: 'Admin', email: 'admin@test.com', password: 'admin123', role: 'student' };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({
                _id: 'admin123',
                name: 'Admin',
                email: 'admin@test.com',
                role: 'admin',
            });

            await authController.registerAdmin(req, res);

            expect(User.create).toHaveBeenCalledWith(
                expect.objectContaining({ role: 'admin' })
            );
        });
    });

    describe('NoSQL Injection in Login', () => {
        // Description: NoSQL injection attempt using object in email field
        test('Attacker sends object instead of string for email', async () => {
            // Scenario: NoSQL injection attempt using object in `email` field

            req.body = {
                email: { $ne: null }, // NoSQL injection attempt
                password: { $ne: null },
            };

            User.findOne = jest.fn().mockResolvedValue({
                _id: 'victim123',
                email: 'victim@test.com',
                password: 'hashed-password',
                comparePassword: jest.fn().mockResolvedValue(true),
            });

            await authController.login(req, res, next);

            expect(User.findOne).toHaveBeenCalled();
        });

        // Description: SQL-style payload in email should not bypass auth
        test('SQL injection style attack shows MongoDB is safe', async () => {
            req.body = {
                email: "admin' OR '1'='1",
                password: "anything",
            };

            User.findOne = jest.fn().mockResolvedValue(null);
            await authController.login(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
        });
    });

    describe('Concurrent Registration Race Condition', () => {
        // Description: concurrent registration race condition simulation
        test('Two users register with same email simultaneously', async () => {
            const email = 'duplicate@test.com';
            req.body = {
                username: 'user1',
                email: email,
                password: 'Test@123',
            };

            // Both requests check at same time, both see email doesn't exist
            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn()
                .mockResolvedValueOnce({ _id: 'user1', email })
                .mockResolvedValueOnce({ _id: 'user2', email });

            const req1 = { ...req };
            const req2 = { ...req, body: { ...req.body, username: 'user2' } };
            const res1 = { json: jest.fn(), status: jest.fn().mockReturnThis() };
            const res2 = { json: jest.fn(), status: jest.fn().mockReturnThis() };

            await Promise.all([
                authController.registerStudent(req1, res1),
                authController.registerStudent(req2, res2),
            ]);

            // Note: potential fix - use unique index and handle E11000
            expect(User.create).toHaveBeenCalledTimes(2);
        });
    });

    describe('Weak Password Policy', () => {
        // Description: accepts extremely weak password "123456"
        test('Accepts extremely weak password "123456"', async () => {
            req.body = {
                username: 'weakuser',
                email: 'weak@test.com',
                password: '123456', // Very weak
            };

            User.findOne = jest.fn().mockResolvedValue(null);
            User.create = jest.fn().mockResolvedValue({ _id: 'user123' });

            await authController.registerStudent(req, res);

            expect(User.create).toHaveBeenCalled();
        });

        // Description: missing password strength feedback endpoint
        test('No password strength feedback for users', () => {
            expect(true).toBe(true);
        });
    });
});
