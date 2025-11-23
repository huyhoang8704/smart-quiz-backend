const path = require('path');

// Mock all dependencies before requiring controller
jest.mock('mongoose');
jest.mock('jsonwebtoken');
jest.mock('@google/generative-ai');

const Quiz = require(path.resolve(__dirname, '..', '..', '..', 'Backend', 'models', 'Quiz'));
const Material = require(path.resolve(__dirname, '..', '..', '..', 'Backend', 'models', 'Material'));
const QuizAttempt = require(path.resolve(__dirname, '..', '..', '..', 'Backend', 'models', 'QuizAttempt'));

const quizController = require(path.resolve(__dirname, '..', '..', '..', 'Backend', 'controllers', 'quizController'));

describe('quizController - Basic Functionality', () => {
    let req, res;

    beforeEach(() => {
        req = {
            user: { id: 'user123', role: 'teacher' },
            body: {},
            params: {},
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        jest.clearAllMocks();
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

    describe('createQuiz - Manual Quiz Creation', () => {
        // Description: creates quiz successfully with valid data
        test('creates quiz successfully with valid data', async () => {
            req.body = {
                title: 'Math Quiz',
                materialId: 'mat123',
                settings: { numQuestions: 5, difficulty: 'medium' },
                questions: [
                    { question: 'What is 2+2?', type: 'mcq', options: ['3', '4', '5'], answer: '4' }
                ],
            };

            const mockQuiz = { _id: 'quiz123', ...req.body, ownerId: 'user123' };
            Quiz.create = jest.fn().mockResolvedValue(mockQuiz);

            await quizController.createQuiz(req, res);

            expect(Quiz.create).toHaveBeenCalledWith({
                ownerId: 'user123',
                title: 'Math Quiz',
                materialId: 'mat123',
                settings: { numQuestions: 5, difficulty: 'medium' },
                questions: req.body.questions,
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockQuiz);
        });

        // Description: handles database errors during creation
        test('handles database errors during creation', async () => {
            req.body = {
                title: 'Quiz',
                materialId: 'mat123',
                settings: {},
                questions: [],
            };

            Quiz.create = jest.fn().mockRejectedValue(new Error('DB Error'));

            await quizController.createQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
        });

        // Description: creates quiz with empty questions array
        test('creates quiz with empty questions array', async () => {
            req.body = {
                title: 'Empty Quiz',
                materialId: 'mat123',
                settings: { numQuestions: 0 },
                questions: [],
            };

            const mockQuiz = { _id: 'quiz123', ...req.body, ownerId: 'user123' };
            Quiz.create = jest.fn().mockResolvedValue(mockQuiz);

            await quizController.createQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockQuiz);
        });

        // Description: creates quiz with multiple question types
        test('creates quiz with multiple question types', async () => {
            req.body = {
                title: 'Mixed Quiz',
                materialId: 'mat123',
                settings: { numQuestions: 3 },
                questions: [
                    { question: 'MCQ?', type: 'mcq', options: ['A', 'B'], answer: 'A' },
                    { question: 'True/False?', type: 'truefalse', options: ['True', 'False'], answer: 'True' },
                    { question: 'Fill _____', type: 'fillblank', options: [], answer: 'blank' },
                ],
            };

            const mockQuiz = { _id: 'quiz123', ...req.body, ownerId: 'user123' };
            Quiz.create = jest.fn().mockResolvedValue(mockQuiz);

            await quizController.createQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockQuiz);
        });
    });

    describe('getQuizById', () => {
        // Description: returns quiz when found (getQuizById)
        test('returns quiz when found', async () => {
            req.params.id = 'quiz123';
            const mockQuiz = {
                _id: 'quiz123',
                title: 'Test Quiz',
                populate: jest.fn().mockResolvedValue({
                    _id: 'quiz123',
                    title: 'Test Quiz',
                    materialId: { _id: 'mat123', title: 'Material' }
                }),
            };

            Quiz.findById = jest.fn().mockReturnValue(mockQuiz);

            await quizController.getQuizById(req, res);

            expect(Quiz.findById).toHaveBeenCalledWith('quiz123');
            expect(mockQuiz.populate).toHaveBeenCalledWith('materialId');
            expect(res.json).toHaveBeenCalled();
        });

        // Description: returns 404 when quiz not found (getQuizById)
        test('returns 404 when quiz not found', async () => {
            req.params.id = 'nonexistent';
            Quiz.findById = jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue(null) });

            await quizController.getQuizById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Quiz not found' });
        });

        // Description: handles database errors in getQuizById
        test('handles database errors', async () => {
            req.params.id = 'quiz123';
            Quiz.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('DB Error'))
            });

            await quizController.getQuizById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
        });

        // Description: handles invalid quiz ID format in getQuizById
        test('handles invalid quiz ID format', async () => {
            req.params.id = 'invalid-id-format';
            Quiz.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('Cast to ObjectId failed'))
            });

            await quizController.getQuizById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getMyQuizzes', () => {
        // Description: returns all quizzes for authenticated user
        test('returns all quizzes for user', async () => {
            const mockQuizzes = [
                { _id: 'quiz1', title: 'Quiz 1', ownerId: 'user123' },
                { _id: 'quiz2', title: 'Quiz 2', ownerId: 'user123' },
            ];

            Quiz.find = jest.fn().mockResolvedValue(mockQuizzes);

            await quizController.getMyQuizzes(req, res);

            expect(Quiz.find).toHaveBeenCalledWith({ ownerId: 'user123' });
            expect(res.json).toHaveBeenCalledWith(mockQuizzes);
        });

        // Description: returns empty array when no quizzes found
        test('returns empty array when no quizzes found', async () => {
            Quiz.find = jest.fn().mockResolvedValue([]);

            await quizController.getMyQuizzes(req, res);

            expect(res.json).toHaveBeenCalledWith([]);
        });

        // Description: handles database errors in getMyQuizzes
        test('handles database errors', async () => {
            Quiz.find = jest.fn().mockRejectedValue(new Error('DB Error'));

            await quizController.getMyQuizzes(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
        });
    });

    describe('deleteQuiz', () => {
        // Description: deletes quiz successfully when user is owner
        test('deletes quiz successfully when user is owner', async () => {
            req.params.id = 'quiz123';
            const mockQuiz = {
                _id: 'quiz123',
                ownerId: { toString: () => 'user123' },
                deleteOne: jest.fn().mockResolvedValue({}),
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);

            await quizController.deleteQuiz(req, res);

            expect(mockQuiz.deleteOne).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith({ message: 'Quiz deleted successfully' });
        });

        // Description: returns 404 when quiz not found during delete
        test('returns 404 when quiz not found', async () => {
            req.params.id = 'nonexistent';
            Quiz.findById = jest.fn().mockResolvedValue(null);

            await quizController.deleteQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Quiz not found' });
        });

        // Description: returns 403 if non-owner attempts deletion
        test('returns 403 when user is not owner', async () => {
            req.params.id = 'quiz123';
            const mockQuiz = {
                _id: 'quiz123',
                ownerId: { toString: () => 'otherUser' },
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);

            await quizController.deleteQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized to delete this quiz' });
        });

        // Description: handles DB errors during quiz deletion
        test('handles database errors during deletion', async () => {
            req.params.id = 'quiz123';
            const mockQuiz = {
                ownerId: { toString: () => 'user123' },
                deleteOne: jest.fn().mockRejectedValue(new Error('DB Error')),
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);

            await quizController.deleteQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'DB Error' });
        });
    });

    describe('attemptQuiz - Student Takes Quiz', () => {
        // Description: grades quiz correctly when all answers match
        test('successfully grades quiz with correct answers', async () => {
            req.params.quizId = 'quiz123';
            req.body = [
                { questionId: 'q1', answer: '4' },
                { questionId: 'q2', answer: 'True' },
            ];

            const mockQuiz = {
                _id: 'quiz123',
                title: 'Math Quiz',
                questions: [
                    { _id: 'q1', question: '2+2?', answer: '4' },
                    { _id: 'q2', question: 'Sky is blue?', answer: 'True' },
                ],
            };

            const mockAttempt = {
                _id: 'attempt123',
                quizId: 'quiz123',
                studentId: 'user123',
                score: 100,
                createdAt: new Date(),
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
            QuizAttempt.create = jest.fn().mockResolvedValue(mockAttempt);

            await quizController.attemptQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    score: 100,
                    correctCount: 2,
                    totalQuestions: 2,
                })
            );
        });

        // Description: grades quiz with some correct and some incorrect answers
        test('grades quiz with partial correct answers', async () => {
            req.params.quizId = 'quiz123';
            req.body = [
                { questionId: 'q1', answer: '4' },
                { questionId: 'q2', answer: 'False' }, // Wrong answer
            ];

            const mockQuiz = {
                _id: 'quiz123',
                title: 'Math Quiz',
                questions: [
                    { _id: 'q1', question: '2+2?', answer: '4' },
                    { _id: 'q2', question: 'Sky is blue?', answer: 'True' },
                ],
            };

            const mockAttempt = {
                _id: 'attempt123',
                quizId: 'quiz123',
                studentId: 'user123',
                score: 50,
                createdAt: new Date(),
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
            QuizAttempt.create = jest.fn().mockResolvedValue(mockAttempt);

            await quizController.attemptQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    score: 50,
                    correctCount: 1,
                    totalQuestions: 2,
                })
            );
        });

        // Description: returns 404 when attempting quiz that doesn't exist
        test('returns 404 when quiz not found', async () => {
            req.params.quizId = 'nonexistent';
            req.body = [];

            Quiz.findById = jest.fn().mockResolvedValue(null);

            await quizController.attemptQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Không tìm thấy quiz.' });
        });

        // Description: returns 400 when submitted answers is not an array
        test('returns 400 when answers is not array', async () => {
            req.params.quizId = 'quiz123';
            req.body = 'not-an-array';

            await quizController.attemptQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Danh sách câu trả lời không hợp lệ.' });
        });

        // Description: returns 400 when quizId is missing from params
        test('returns 400 when quizId is missing', async () => {
            req.params.quizId = '';
            req.body = [];

            await quizController.attemptQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Quiz ID không được để trống.' });
        });

        // Description: handles missing answers for some questions gracefully
        test('handles missing answers for some questions', async () => {
            req.params.quizId = 'quiz123';
            req.body = [
                { questionId: 'q1', answer: '4' },
                // Missing answer for q2
            ];

            const mockQuiz = {
                _id: 'quiz123',
                title: 'Math Quiz',
                questions: [
                    { _id: 'q1', question: '2+2?', answer: '4' },
                    { _id: 'q2', question: 'Sky is blue?', answer: 'True' },
                ],
            };

            const mockAttempt = {
                _id: 'attempt123',
                quizId: 'quiz123',
                studentId: 'user123',
                score: 50,
                createdAt: new Date(),
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
            QuizAttempt.create = jest.fn().mockResolvedValue(mockAttempt);

            await quizController.attemptQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    correctCount: 1,
                    totalQuestions: 2,
                })
            );
        });

        // Description: comparison of answers is case-insensitive
        test('is case-insensitive when comparing answers', async () => {
            req.params.quizId = 'quiz123';
            req.body = [
                { questionId: 'q1', answer: 'TRUE' }, // Uppercase
            ];

            const mockQuiz = {
                _id: 'quiz123',
                title: 'Quiz',
                questions: [
                    { _id: 'q1', question: 'Test?', answer: 'true' }, // Lowercase
                ],
            };

            const mockAttempt = {
                _id: 'attempt123',
                quizId: 'quiz123',
                studentId: 'user123',
                score: 100,
                createdAt: new Date(),
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
            QuizAttempt.create = jest.fn().mockResolvedValue(mockAttempt);

            await quizController.attemptQuiz(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    score: 100,
                    correctCount: 1,
                })
            );
        });

        // Description: trims whitespace from submitted answers before comparing
        test('trims whitespace from answers', async () => {
            req.params.quizId = 'quiz123';
            req.body = [
                { questionId: 'q1', answer: '  4  ' }, // With spaces
            ];

            const mockQuiz = {
                _id: 'quiz123',
                title: 'Quiz',
                questions: [
                    { _id: 'q1', question: '2+2?', answer: '4' },
                ],
            };

            const mockAttempt = {
                _id: 'attempt123',
                quizId: 'quiz123',
                studentId: 'user123',
                score: 100,
                createdAt: new Date(),
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
            QuizAttempt.create = jest.fn().mockResolvedValue(mockAttempt);

            await quizController.attemptQuiz(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    score: 100,
                })
            );
        });

        // Description: handles DB errors when creating an attempt record
        test('handles database errors during attempt creation', async () => {
            req.params.quizId = 'quiz123';
            req.body = [{ questionId: 'q1', answer: '4' }];

            const mockQuiz = {
                _id: 'quiz123',
                title: 'Quiz',
                questions: [{ _id: 'q1', question: '2+2?', answer: '4' }],
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
            QuizAttempt.create = jest.fn().mockRejectedValue(new Error('DB Error'));

            await quizController.attemptQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Lỗi server khi chấm quiz.',
                error: 'DB Error',
            });
        });
    });
});
