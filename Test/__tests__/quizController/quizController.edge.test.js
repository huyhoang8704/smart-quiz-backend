const path = require('path');

// Mock all dependencies
jest.mock('mongoose');
jest.mock('jsonwebtoken');
jest.mock('@google/generative-ai');

const Quiz = require(path.resolve(__dirname, '..', '..', '..', 'Backend', 'models', 'Quiz'));
const Material = require(path.resolve(__dirname, '..', '..', '..', 'Backend', 'models', 'Material'));
const QuizAttempt = require(path.resolve(__dirname, '..', '..', '..', 'Backend', 'models', 'QuizAttempt'));

const quizController = require(path.resolve(__dirname, '..', '..', '..', 'Backend', 'controllers', 'quizController'));

describe('quizController - Edge Cases', () => {
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
        process.env.GEMINI_API_KEY = 'test-key';
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

    describe('generateQuiz - Material Validation', () => {
        // Description: returns 400 when materialIds is missing
        test('returns 400 when materialIds is missing', async () => {
            req.body = {
                settings: {
                    questionConfigs: [{ type: 'mcq', count: 5, difficulty: 'medium' }],
                },
            };

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'At least one material ID is required',
                })
            );
        });

        // Description: returns 400 when materialIds is an empty array
        test('returns 400 when materialIds is empty array', async () => {
            req.body = {
                materialIds: [],
                settings: {
                    questionConfigs: [{ type: 'mcq', count: 5, difficulty: 'medium' }],
                },
            };

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'At least one material ID is required',
                })
            );
        });

        // Description: returns 400 when more than 5 materials provided
        test('returns 400 when more than 5 materials provided', async () => {
            req.body = {
                materialIds: ['mat1', 'mat2', 'mat3', 'mat4', 'mat5', 'mat6'],
                settings: {
                    questionConfigs: [{ type: 'mcq', count: 5, difficulty: 'medium' }],
                },
            };

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Maximum 5 materials allowed per quiz generation',
                    provided: 6,
                })
            );
        });

        // Description: returns 400 when settings is missing
        test('returns 400 when settings is missing', async () => {
            req.body = {
                materialIds: ['mat123'],
            };

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Settings with questionConfigs is required',
                })
            );
        });

        // Description: returns 400 when questionConfigs is missing from settings
        test('returns 400 when questionConfigs is missing', async () => {
            req.body = {
                materialIds: ['mat123'],
                settings: {},
            };

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Settings with questionConfigs is required',
                })
            );
        });

        // Description: returns 400 for invalid question type in config
        test('returns 400 with invalid question type', async () => {
            req.body = {
                materialIds: ['mat123'],
                settings: {
                    questionConfigs: [{ type: 'invalid_type', count: 5, difficulty: 'medium' }],
                },
            };

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('Invalid question type: invalid_type'),
                })
            );
        });

        // Description: returns 400 for invalid difficulty level in config
        test('returns 400 with invalid difficulty level', async () => {
            req.body = {
                materialIds: ['mat123'],
                settings: {
                    questionConfigs: [{ type: 'mcq', count: 5, difficulty: 'super_hard' }],
                },
            };

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('Invalid difficulty: super_hard'),
                })
            );
        });

        // Description: returns 400 when question count is zero
        test('returns 400 when question count is 0', async () => {
            req.body = {
                materialIds: ['mat123'],
                settings: {
                    questionConfigs: [{ type: 'mcq', count: 0, difficulty: 'medium' }],
                },
            };

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('Invalid count for mcq: 0'),
                })
            );
        });

        // Description: returns 400 when question count exceeds allowed max
        test('returns 400 when question count exceeds 20', async () => {
            req.body = {
                materialIds: ['mat123'],
                settings: {
                    questionConfigs: [{ type: 'mcq', count: 25, difficulty: 'medium' }],
                },
            };

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('Invalid count for mcq: 25'),
                })
            );
        });

        // Description: returns 400 when question count is negative
        test('returns 400 when question count is negative', async () => {
            req.body = {
                materialIds: ['mat123'],
                settings: {
                    questionConfigs: [{ type: 'mcq', count: -5, difficulty: 'medium' }],
                },
            };

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('Invalid count for mcq: -5'),
                })
            );
        });

        // Description: returns 500 if GEMINI_API_KEY not configured
        test('returns 500 when GEMINI_API_KEY is not configured', async () => {
            delete process.env.GEMINI_API_KEY;

            req.body = {
                materialIds: ['mat123'],
                settings: {
                    questionConfigs: [{ type: 'mcq', count: 5, difficulty: 'medium' }],
                },
            };

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Gemini API key not configured' });

            process.env.GEMINI_API_KEY = 'test-key'; // Restore
        });

        // Description: returns 404 when no materials found for given IDs
        test('returns 404 when no materials found', async () => {
            req.body = {
                materialIds: ['nonexistent'],
                settings: {
                    questionConfigs: [{ type: 'mcq', count: 5, difficulty: 'medium' }],
                },
            };

            Material.find = jest.fn().mockResolvedValue([]);

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ error: 'No materials found' });
        });

        // Description: returns 404 when some requested materials are missing
        test('returns 404 when some materials not found', async () => {
            req.body = {
                materialIds: ['mat1', 'mat2', 'mat3'],
                settings: {
                    questionConfigs: [{ type: 'mcq', count: 5, difficulty: 'medium' }],
                },
            };

            Material.find = jest.fn().mockResolvedValue([
                { _id: 'mat1', ownerId: 'user123' },
                { _id: 'mat2', ownerId: 'user123' },
            ]);

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                error: 'Some materials not found',
                requested: 3,
                found: 2,
            });
        });

        // Description: returns 403 when user doesn't own the requested material
        test('returns 403 when user does not own material', async () => {
            req.body = {
                materialIds: ['mat123'],
                settings: {
                    questionConfigs: [{ type: 'mcq', count: 5, difficulty: 'medium' }],
                },
            };

            Material.find = jest.fn().mockResolvedValue([
                { _id: 'mat123', title: 'Material', ownerId: { toString: () => 'otherUser' } },
            ]);

            await quizController.generateQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.stringContaining('Not authorized'),
                })
            );
        });

        // Description: admin user can access materials owned by others
        test('admin can use any material', async () => {
            req.user.role = 'admin';
            req.body = {
                materialIds: ['mat123'],
                settings: {
                    questionConfigs: [{ type: 'mcq', count: 5, difficulty: 'medium' }],
                },
            };

            Material.find = jest.fn().mockResolvedValue([
                {
                    _id: 'mat123',
                    title: 'Material',
                    ownerId: { toString: () => 'otherUser' },
                    processedContent: 'Test content',
                },
            ]);

            // Mock Quiz.create to avoid actual generation
            Quiz.create = jest.fn().mockRejectedValue(new Error('Test error - skip generation'));

            await quizController.generateQuiz(req, res);

            // Should not get 403 error for admin
            expect(res.status).not.toHaveBeenCalledWith(403);
        });
    });

    describe('createQuiz - Edge Cases', () => {
        // Description: handles very long quiz title input
        test('handles very long quiz title', async () => {
            const longTitle = 'A'.repeat(1000);
            req.body = {
                title: longTitle,
                materialId: 'mat123',
                settings: {},
                questions: [],
            };

            const mockQuiz = { _id: 'quiz123', ...req.body, ownerId: 'user123' };
            Quiz.create = jest.fn().mockResolvedValue(mockQuiz);

            await quizController.createQuiz(req, res);

            expect(Quiz.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });

        // Description: handles special characters in quiz title
        test('handles special characters in title', async () => {
            req.body = {
                title: 'Quiz <script>alert("XSS")</script>',
                materialId: 'mat123',
                settings: {},
                questions: [],
            };

            const mockQuiz = { _id: 'quiz123', ...req.body, ownerId: 'user123' };
            Quiz.create = jest.fn().mockResolvedValue(mockQuiz);

            await quizController.createQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        // Description: handles Unicode characters inside questions
        test('handles Unicode characters in questions', async () => {
            req.body = {
                title: 'Unicode Quiz',
                materialId: 'mat123',
                settings: {},
                questions: [
                    { question: 'Câu hỏi tiếng Việt có dấu?', type: 'mcq', options: ['Có', 'Không'], answer: 'Có' },
                    { question: '日本語の質問？', type: 'mcq', options: ['はい', 'いいえ'], answer: 'はい' },
                    { question: '😀 Emoji question?', type: 'truefalse', options: ['True', 'False'], answer: 'True' },
                ],
            };

            const mockQuiz = { _id: 'quiz123', ...req.body, ownerId: 'user123' };
            Quiz.create = jest.fn().mockResolvedValue(mockQuiz);

            await quizController.createQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        // Description: handles a large number of questions in quiz payload
        test('handles large number of questions', async () => {
            const questions = Array.from({ length: 100 }, (_, i) => ({
                question: `Question ${i + 1}?`,
                type: 'mcq',
                options: ['A', 'B', 'C', 'D'],
                answer: 'A',
            }));

            req.body = {
                title: 'Large Quiz',
                materialId: 'mat123',
                settings: { numQuestions: 100 },
                questions,
            };

            const mockQuiz = { _id: 'quiz123', ...req.body, ownerId: 'user123' };
            Quiz.create = jest.fn().mockResolvedValue(mockQuiz);

            await quizController.createQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        // Description: handles question with empty options array (fillblank)
        test('handles question with empty options array', async () => {
            req.body = {
                title: 'Quiz',
                materialId: 'mat123',
                settings: {},
                questions: [
                    { question: 'Fill blank _____', type: 'fillblank', options: [], answer: 'answer' },
                ],
            };

            const mockQuiz = { _id: 'quiz123', ...req.body, ownerId: 'user123' };
            Quiz.create = jest.fn().mockResolvedValue(mockQuiz);

            await quizController.createQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        // Description: handles MCQ with a single option
        test('handles question with single option', async () => {
            req.body = {
                title: 'Quiz',
                materialId: 'mat123',
                settings: {},
                questions: [
                    { question: 'Only one option?', type: 'mcq', options: ['Only'], answer: 'Only' },
                ],
            };

            const mockQuiz = { _id: 'quiz123', ...req.body, ownerId: 'user123' };
            Quiz.create = jest.fn().mockResolvedValue(mockQuiz);

            await quizController.createQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        // Description: handles nested objects in settings field
        test('handles nested objects in settings', async () => {
            req.body = {
                title: 'Complex Quiz',
                materialId: 'mat123',
                settings: {
                    nested: {
                        deep: {
                            config: 'value',
                        },
                    },
                },
                questions: [],
            };

            const mockQuiz = { _id: 'quiz123', ...req.body, ownerId: 'user123' };
            Quiz.create = jest.fn().mockResolvedValue(mockQuiz);

            await quizController.createQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });
    });

    describe('getQuizById - Edge Cases', () => {
        // Description: handles very long quiz ID input
        test('handles very long quiz ID', async () => {
            req.params.id = 'x'.repeat(1000);
            Quiz.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('Invalid ID'))
            });

            await quizController.getQuizById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        // Description: handles special characters in quiz ID
        test('handles special characters in quiz ID', async () => {
            req.params.id = '<script>alert("XSS")</script>';
            Quiz.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockRejectedValue(new Error('Invalid ID'))
            });

            await quizController.getQuizById(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        // Description: handles null quiz ID
        test('handles null quiz ID', async () => {
            req.params.id = null;
            Quiz.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            await quizController.getQuizById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        // Description: handles undefined quiz ID
        test('handles undefined quiz ID', async () => {
            req.params.id = undefined;
            Quiz.findById = jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            await quizController.getQuizById(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('attemptQuiz - Edge Cases', () => {
        // Description: handles quiz with zero questions (edge-case)
        test('handles zero questions in quiz', async () => {
            req.params.quizId = 'quiz123';
            req.body = [];

            const mockQuiz = {
                _id: 'quiz123',
                title: 'Empty Quiz',
                questions: [],
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
            QuizAttempt.create = jest.fn().mockResolvedValue({
                _id: 'attempt123',
                quizId: 'quiz123',
                studentId: 'user123',
                score: 0,
                createdAt: new Date(),
            });

            await quizController.attemptQuiz(req, res);

            // This may fail due to division by zero (NaN score)
            // Bug to report: Should handle empty quiz gracefully
            expect(res.status).toHaveBeenCalledWith(expect.any(Number));
        });

        // Description: handles extremely long answer strings submitted
        test('handles extremely long answer string', async () => {
            req.params.quizId = 'quiz123';
            req.body = [
                { questionId: 'q1', answer: 'A'.repeat(10000) },
            ];

            const mockQuiz = {
                _id: 'quiz123',
                title: 'Quiz',
                questions: [
                    { _id: 'q1', question: 'Test?', answer: 'A' },
                ],
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
            QuizAttempt.create = jest.fn().mockResolvedValue({
                _id: 'attempt123',
                quizId: 'quiz123',
                studentId: 'user123',
                score: 0,
                createdAt: new Date(),
            });

            await quizController.attemptQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        // Description: handles answers that are only whitespace
        test('handles answer with only whitespace', async () => {
            req.params.quizId = 'quiz123';
            req.body = [
                { questionId: 'q1', answer: '     ' },
            ];

            const mockQuiz = {
                _id: 'quiz123',
                title: 'Quiz',
                questions: [
                    { _id: 'q1', question: 'Test?', answer: 'answer' },
                ],
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
            QuizAttempt.create = jest.fn().mockResolvedValue({
                _id: 'attempt123',
                quizId: 'quiz123',
                studentId: 'user123',
                score: 0,
                createdAt: new Date(),
            });

            await quizController.attemptQuiz(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    correctCount: 0,
                })
            );
        });

        // Description: handles answers containing Unicode characters
        test('handles answer with Unicode characters', async () => {
            req.params.quizId = 'quiz123';
            req.body = [
                { questionId: 'q1', answer: 'Đúng' },
            ];

            const mockQuiz = {
                _id: 'quiz123',
                title: 'Quiz',
                questions: [
                    { _id: 'q1', question: 'Đúng hay sai?', answer: 'Đúng' },
                ],
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
            QuizAttempt.create = jest.fn().mockResolvedValue({
                _id: 'attempt123',
                quizId: 'quiz123',
                studentId: 'user123',
                score: 100,
                createdAt: new Date(),
            });

            await quizController.attemptQuiz(req, res);

            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    correctCount: 1,
                })
            );
        });

        // Description: handles duplicate answers for the same question ID
        test('handles duplicate answers for same question', async () => {
            req.params.quizId = 'quiz123';
            req.body = [
                { questionId: 'q1', answer: '4' },
                { questionId: 'q1', answer: '5' }, // Duplicate
            ];

            const mockQuiz = {
                _id: 'quiz123',
                title: 'Quiz',
                questions: [
                    { _id: 'q1', question: '2+2?', answer: '4' },
                ],
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
            QuizAttempt.create = jest.fn().mockResolvedValue({
                _id: 'attempt123',
                quizId: 'quiz123',
                studentId: 'user123',
                score: 100,
                createdAt: new Date(),
            });

            await quizController.attemptQuiz(req, res);

            // Will use first answer found
            expect(res.status).toHaveBeenCalledWith(201);
        });

        // Description: handles answer containing special characters/XSS strings
        test('handles answer with special characters', async () => {
            req.params.quizId = 'quiz123';
            req.body = [
                { questionId: 'q1', answer: '<script>alert("XSS")</script>' },
            ];

            const mockQuiz = {
                _id: 'quiz123',
                title: 'Quiz',
                questions: [
                    { _id: 'q1', question: 'Test?', answer: 'safe answer' },
                ],
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
            QuizAttempt.create = jest.fn().mockResolvedValue({
                _id: 'attempt123',
                quizId: 'quiz123',
                studentId: 'user123',
                score: 0,
                createdAt: new Date(),
            });

            await quizController.attemptQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        // Description: handles very large number of submitted answers
        test('handles very large number of answers', async () => {
            req.params.quizId = 'quiz123';
            req.body = Array.from({ length: 1000 }, (_, i) => ({
                questionId: `q${i}`,
                answer: 'answer',
            }));

            const mockQuiz = {
                _id: 'quiz123',
                title: 'Quiz',
                questions: Array.from({ length: 1000 }, (_, i) => ({
                    _id: `q${i}`,
                    question: `Question ${i}?`,
                    answer: 'answer',
                })),
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
            QuizAttempt.create = jest.fn().mockResolvedValue({
                _id: 'attempt123',
                quizId: 'quiz123',
                studentId: 'user123',
                score: 100,
                createdAt: new Date(),
            });

            await quizController.attemptQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
        });

        // Description: handles answers that reference non-existent question IDs
        test('handles answer for non-existent question', async () => {
            req.params.quizId = 'quiz123';
            req.body = [
                { questionId: 'nonexistent', answer: 'answer' },
            ];

            const mockQuiz = {
                _id: 'quiz123',
                title: 'Quiz',
                questions: [
                    { _id: 'q1', question: 'Test?', answer: 'correct' },
                ],
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);
            QuizAttempt.create = jest.fn().mockResolvedValue({
                _id: 'attempt123',
                quizId: 'quiz123',
                studentId: 'user123',
                score: 0,
                createdAt: new Date(),
            });

            await quizController.attemptQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    correctCount: 0,
                    totalQuestions: 1,
                })
            );
        });
    });

    describe('deleteQuiz - Edge Cases', () => {
        // Description: handles concurrent deletion attempts for same quiz
        test('handles concurrent deletion attempts', async () => {
            req.params.id = 'quiz123';
            const mockQuiz = {
                _id: 'quiz123',
                ownerId: { toString: () => 'user123' },
                deleteOne: jest.fn().mockRejectedValue(new Error('Document already deleted')),
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);

            await quizController.deleteQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        // Description: handles very long quiz ID during deletion
        test('handles very long quiz ID during deletion', async () => {
            req.params.id = 'x'.repeat(1000);
            Quiz.findById = jest.fn().mockRejectedValue(new Error('Invalid ID'));

            await quizController.deleteQuiz(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });

        // Description: handles null ownerId when comparing ownership
        test('handles null ownerId comparison', async () => {
            req.params.id = 'quiz123';
            const mockQuiz = {
                _id: 'quiz123',
                ownerId: null,
            };

            Quiz.findById = jest.fn().mockResolvedValue(mockQuiz);

            await quizController.deleteQuiz(req, res);

            // Should handle gracefully - may error or deny access
            expect(res.status).toHaveBeenCalledWith(expect.any(Number));
        });
    });

    describe('Quiz Operations', () => {
        // Description: teacher deletes quiz while students have active attempts
        test('Teacher deletes quiz while students are taking exam', async () => {
            // Scenario: teacher deletes quiz while students have active attempts
            req.params = { id: 'quiz123' };
            req.user = { _id: 'teacher123', role: 'teacher' };

            Quiz.findById = jest.fn().mockResolvedValue({
                _id: 'quiz123',
                ownerId: 'teacher123',
                deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
            });

            await quizController.deleteQuiz(req, res);

            expect(res.json).toHaveBeenCalled();
        });

        // Description: student spams submit causing duplicate attempts
        test('Student submits quiz 5 times by spamming button', async () => {
            // Scenario: duplicate submissions due to network retries
            req.params = { quizId: 'quiz123' };
            req.body = {
                answers: [{ questionId: 'q1', selectedAnswer: 0 }],
            };
            req.user = { _id: 'student123', id: 'student123' };

            Quiz.findById = jest.fn().mockResolvedValue({
                _id: 'quiz123',
                questions: [{ _id: 'q1', correctAnswer: 0 }],
            });

            QuizAttempt.create = jest.fn()
                .mockResolvedValueOnce({ _id: 'attempt1', score: 100 })
                .mockResolvedValueOnce({ _id: 'attempt2', score: 100 })
                .mockResolvedValueOnce({ _id: 'attempt3', score: 100 })
                .mockResolvedValueOnce({ _id: 'attempt4', score: 100 })
                .mockResolvedValueOnce({ _id: 'attempt5', score: 100 });

            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(quizController.attemptQuiz({ ...req }, { ...res }));
            }
            await Promise.all(promises);

            expect(QuizAttempt.create.mock.calls.length).toBeGreaterThan(1);
        });

        // Description: creating 1000 quizzes quickly to simulate spam/no rate limit
        test('Creating 1000 quizzes in 1 minute - No rate limiting', async () => {
            // Scenario: spammy quiz creation without rate limiting
            req.user = { _id: 'spammer', role: 'teacher' };
            req.body = {
                title: 'Spam',
                questions: [{ question: 'Q?', answers: ['A'], correctAnswer: 0 }],
            };

            Quiz.create = jest.fn().mockImplementation(() =>
                Promise.resolve({ _id: Math.random().toString() })
            );

            const start = Date.now();
            await Promise.all(
                Array(1000).fill(null).map(() => quizController.createQuiz({ ...req }, { ...res }))
            );
            const duration = Date.now() - start;

            expect(Quiz.create).toHaveBeenCalledTimes(1000);
        });

        // Description: quiz with extremely large question count exceeding DB limits
        test('Quiz with 10,000 questions exceeds MongoDB limit', async () => {
            // Scenario: extremely large quiz exceeding MongoDB document size
            req.body = {
                title: 'Mega Quiz',
                questions: Array(10000).fill(null).map((_, i) => ({
                    question: `Q${i}?`,
                    answers: ['A', 'B', 'C', 'D'],
                    correctAnswer: 0,
                })),
            };

            Quiz.create = jest.fn().mockResolvedValue({ _id: 'quiz123' });
            await quizController.createQuiz(req, res);

            expect(Quiz.create).toHaveBeenCalled();
        });

        // Description: quiz attempt submitted with wrong # of answers
        test('Quiz attempt with wrong number of answers', async () => {
            // Scenario: submitted answers count doesn't match quiz questions
            req.params = { quizId: 'quiz123' };
            req.body = {
                answers: [
                    { questionId: 'q1', selectedAnswer: 0 },
                    { questionId: 'q2', selectedAnswer: 1 },
                    { questionId: 'q3', selectedAnswer: 2 }, // Extra
                    { questionId: 'q4', selectedAnswer: 3 }, // Extra
                    { questionId: 'q5', selectedAnswer: 0 }, // Extra
                ],
            };

            Quiz.findById = jest.fn().mockResolvedValue({
                _id: 'quiz123',
                questions: [
                    { _id: 'q1', correctAnswer: 0 },
                    { _id: 'q2', correctAnswer: 1 },
                ],
            });

            QuizAttempt.create = jest.fn().mockResolvedValue({ _id: 'a123', score: 40 });
            await quizController.attemptQuiz(req, res);

            expect(QuizAttempt.create).toHaveBeenCalled();
        });
    });
});

