const path = require('path');

jest.mock('../../../Backend/models/QuizAttempt');
jest.mock('../../../Backend/models/Quiz');

const QuizAttempt = require(path.resolve(__dirname, '..', '..', '..', 'Backend', 'models', 'QuizAttempt'));
const Quiz = require(path.resolve(__dirname, '..', '..', '..', 'Backend', 'models', 'Quiz'));
const quizAttemptController = require(path.resolve(__dirname, '..', '..', '..', 'Backend', 'controllers', 'quizAttemptController'));

describe('Quiz Attempt API Endpoints - Comprehensive Tests', () => {
	let req, res;

	beforeEach(() => {
		req = {
			body: {},
			params: {},
			query: {},
			user: { _id: 'student123', id: 'student123', role: 'student' },
		};
		res = {
			json: jest.fn(),
			status: jest.fn().mockReturnThis(),
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

	// ============================================================================
	// GET /api/quizzes/:id/attempts
	// ============================================================================
	describe('GET /api/quizzes/:id/attempts', () => {
		describe('✅ Success Cases', () => {
			// Description: retrieves quiz attempts after validating quiz exists
			test('should get quiz attempts with quiz validation', async () => {
				req.params = { id: 'quiz123' };

				Quiz.findById = jest.fn().mockResolvedValue({
					_id: 'quiz123',
					title: 'Java Quiz',
				});

				const mockAttempts = [
					{
						_id: 'attempt1',
						quizId: 'quiz123',
						studentId: 'student1',
						score: 85,
						totalQuestions: 10,
					},
					{
						_id: 'attempt2',
						quizId: 'quiz123',
						studentId: 'student2',
						score: 90,
						totalQuestions: 10,
					},
				];

				QuizAttempt.find = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnValue({
						sort: jest.fn().mockResolvedValue(mockAttempts),
					}),
				});

				await quizAttemptController.getAttemptsByQuiz(req, res);

				expect(Quiz.findById).toHaveBeenCalledWith('quiz123');
				expect(QuizAttempt.find).toHaveBeenCalledWith({ quizId: 'quiz123' });
				expect(res.json).toHaveBeenCalledWith(mockAttempts);
			});

			// Description: returns empty array when no attempts exist for quiz
			test('should return empty array when no attempts found', async () => {
				req.params = { id: 'quiz123' };

				Quiz.findById = jest.fn().mockResolvedValue({
					_id: 'quiz123',
					title: 'Java Quiz',
				});

				QuizAttempt.find = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnValue({
						sort: jest.fn().mockResolvedValue([]),
					}),
				});

				await quizAttemptController.getAttemptsByQuiz(req, res);

				expect(res.json).toHaveBeenCalledWith([]);
			});
		});

		describe('❌ Validation Failures', () => {
			// Description: returns 404 when referenced quiz does not exist
			test('should return 404 when quiz not found', async () => {
				req.params = { id: 'nonexistent' };

				Quiz.findById = jest.fn().mockResolvedValue(null);

				await quizAttemptController.getAttemptsByQuiz(req, res);

				expect(res.status).toHaveBeenCalledWith(404);
				expect(res.json).toHaveBeenCalledWith({ message: 'Quiz not found' });
			});
		});

		describe('🔥 Edge Cases', () => {
			// Description: handles invalid quiz ID formats gracefully
			test('should handle invalid quiz ID format', async () => {
				req.params = { id: 'invalid-quiz-id' };

				Quiz.findById = jest.fn().mockRejectedValue(
					new Error('Cast to ObjectId failed')
				);

				await quizAttemptController.getAttemptsByQuiz(req, res);

				expect(res.status).toHaveBeenCalledWith(500);
			});

			// Description: handles excessively long quiz ID values
			test('should handle very long quiz ID', async () => {
				req.params = { id: 'a'.repeat(10000) };

				Quiz.findById = jest.fn().mockRejectedValue(
					new Error('Cast to ObjectId failed')
				);

				await quizAttemptController.getAttemptsByQuiz(req, res);

				expect(res.status).toHaveBeenCalledWith(500);
			});

			// Description: handles database connection timeout during lookup
			test('should handle database connection timeout', async () => {
				req.params = { id: 'quiz123' };

				Quiz.findById = jest.fn().mockRejectedValue(
					new Error('Connection timeout')
				);

				await quizAttemptController.getAttemptsByQuiz(req, res);

				expect(res.status).toHaveBeenCalledWith(500);
			});

			// Description: handles very large result sets of attempts
			test('should handle large result set (1000+ attempts)', async () => {
				req.params = { id: 'quiz123' };

				Quiz.findById = jest.fn().mockResolvedValue({
					_id: 'quiz123',
					title: 'Java Quiz',
				});

				const mockAttempts = Array(1000).fill(null).map((_, i) => ({
					_id: `attempt${i}`,
					quizId: 'quiz123',
					studentId: `student${i}`,
					score: Math.random() * 100,
					totalQuestions: 10,
				}));

				QuizAttempt.find = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnValue({
						sort: jest.fn().mockResolvedValue(mockAttempts),
					}),
				});

				await quizAttemptController.getAttemptsByQuiz(req, res);

				expect(res.json).toHaveBeenCalledWith(mockAttempts);
			});

			// Description: tolerates corrupt data within attempt documents
			test('should handle corrupt data in attempts', async () => {
				req.params = { id: 'quiz123' };

				Quiz.findById = jest.fn().mockResolvedValue({
					_id: 'quiz123',
					title: 'Java Quiz',
				});

				const mockAttempts = [
					{
						_id: 'attempt1',
						quizId: 'quiz123',
						studentId: null, // Corrupted data
						score: 'invalid', // Invalid type
						totalQuestions: -5, // Negative value
					},
				];

				QuizAttempt.find = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnValue({
						sort: jest.fn().mockResolvedValue(mockAttempts),
					}),
				});

				await quizAttemptController.getAttemptsByQuiz(req, res);

				// Backend doesn't validate data integrity
				expect(res.json).toHaveBeenCalledWith(mockAttempts);
			});

			// Description: handles empty quiz ID parameter
			test('should handle empty quiz ID', async () => {
				req.params = { id: '' };

				Quiz.findById = jest.fn().mockResolvedValue(null);

				await quizAttemptController.getAttemptsByQuiz(req, res);

				expect(res.status).toHaveBeenCalledWith(404);
			});
		});
	});

	// ============================================================================
	// GET /api/attempts/:attemptId
	// ============================================================================
	describe('GET /api/attempts/:attemptId', () => {
		describe('✅ Success Cases', () => {
			// Description: retrieves single attempt details with populated refs
			test('should get single attempt details', async () => {
				req.params = { attemptId: 'attempt123' };

				const mockAttempt = {
					_id: 'attempt123',
					quizId: {
						_id: 'quiz123',
						title: 'Java Quiz',
					},
					studentId: 'student123',
					score: 85,
					totalQuestions: 10,
					answers: [
						{ questionId: 'q1', selectedAnswer: 0, isCorrect: true },
						{ questionId: 'q2', selectedAnswer: 1, isCorrect: false },
					],
					createdAt: new Date(),
				};

				QuizAttempt.findById = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnValue({
						populate: jest.fn().mockResolvedValue(mockAttempt),
					}),
				});

				await quizAttemptController.getAttemptById(req, res);

				expect(res.json).toHaveBeenCalledWith(mockAttempt);
			});
		});

		describe('❌ Authorization Failures', () => {
			// Description: returns 404 when attempt ID not found
			test('should return 404 when attempt not found', async () => {
				req.params = { attemptId: 'nonexistent' };

				QuizAttempt.findById = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnValue({
						populate: jest.fn().mockResolvedValue(null),
					}),
				});

				await quizAttemptController.getAttemptById(req, res);

				expect(res.status).toHaveBeenCalledWith(404);
				expect(res.json).toHaveBeenCalledWith({
					message: 'Attempt not found',
				});
			});
		});

		describe('🔥 Edge Cases', () => {
			// Description: handles invalid attempt ID formats
			test('should handle invalid attempt ID format', async () => {
				req.params = { attemptId: 'invalid-id' };

				QuizAttempt.findById = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnValue({
						populate: jest.fn().mockRejectedValue(
							new Error('Cast to ObjectId failed')
						),
					}),
				});

				await quizAttemptController.getAttemptById(req, res);

				expect(res.status).toHaveBeenCalledWith(500);
			});

			// Description: handles attempt whose quiz reference was deleted
			test('should handle attempt with missing quiz reference', async () => {
				req.params = { attemptId: 'attempt123' };

				const mockAttempt = {
					_id: 'attempt123',
					quizId: null, // Quiz was deleted
					studentId: 'student123',
					score: 85,
				};

				QuizAttempt.findById = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnValue({
						populate: jest.fn().mockResolvedValue(mockAttempt),
					}),
				});

				await quizAttemptController.getAttemptById(req, res);

				// Backend doesn't check for null quiz reference
				expect(res.json).toHaveBeenCalledWith(mockAttempt);
			});

			// Description: handles attempt documents with very large answers arrays
			test('should handle attempt with very large answers array', async () => {
				req.params = { attemptId: 'attempt123' };

				const mockAttempt = {
					_id: 'attempt123',
					quizId: { _id: 'quiz123' },
					studentId: 'student123',
					score: 85,
					answers: Array(10000).fill(null).map((_, i) => ({
						questionId: `q${i}`,
						selectedAnswer: 0,
						isCorrect: true,
					})),
				};

				QuizAttempt.findById = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnValue({
						populate: jest.fn().mockResolvedValue(mockAttempt),
					}),
				});

				await quizAttemptController.getAttemptById(req, res);

				expect(res.json).toHaveBeenCalledWith(mockAttempt);
			});

			// Description: handles circular references in attempt data
			test('should handle attempt with circular reference', async () => {
				req.params = { attemptId: 'attempt123' };

				const mockAttempt = {
					_id: 'attempt123',
					quizId: { _id: 'quiz123', attempts: [] },
					studentId: 'student123',
					score: 85,
				};
				mockAttempt.quizId.attempts.push(mockAttempt); // Circular reference

				QuizAttempt.findById = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnValue({
						populate: jest.fn().mockResolvedValue(mockAttempt),
					}),
				});

				await quizAttemptController.getAttemptById(req, res);

				// JSON serialization will fail with circular reference
				expect(res.json).toHaveBeenCalled();
			});

			// Description: tolerates negative score values in attempt record
			test('should handle attempt with negative score', async () => {
				req.params = { attemptId: 'attempt123' };

				const mockAttempt = {
					_id: 'attempt123',
					quizId: { _id: 'quiz123' },
					studentId: 'student123',
					score: -50, // Invalid negative score
					totalQuestions: 10,
				};

				QuizAttempt.findById = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnValue({
						populate: jest.fn().mockResolvedValue(mockAttempt),
					}),
				});

				await quizAttemptController.getAttemptById(req, res);

				// Backend doesn't validate score range
				expect(res.json).toHaveBeenCalledWith(mockAttempt);
			});

			// Description: tolerates score values greater than 100 in record
			test('should handle attempt with score > 100', async () => {
				req.params = { attemptId: 'attempt123' };

				const mockAttempt = {
					_id: 'attempt123',
					quizId: { _id: 'quiz123' },
					studentId: 'student123',
					score: 150, // Invalid score over 100
					totalQuestions: 10,
				};

				QuizAttempt.findById = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnValue({
						populate: jest.fn().mockResolvedValue(mockAttempt),
					}),
				});

				await quizAttemptController.getAttemptById(req, res);

				// Backend doesn't validate max score
				expect(res.json).toHaveBeenCalledWith(mockAttempt);
			});

			// Description: handles empty attemptId parameter
			test('should handle empty attemptId', async () => {
				req.params = { attemptId: '' };

				QuizAttempt.findById = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnValue({
						populate: jest.fn().mockResolvedValue(null),
					}),
				});

				await quizAttemptController.getAttemptById(req, res);

				expect(res.status).toHaveBeenCalledWith(404);
			});

			// Description: tolerates malformed answers array in attempt doc
			test('should handle attempt with malformed answers array', async () => {
				req.params = { attemptId: 'attempt123' };

				const mockAttempt = {
					_id: 'attempt123',
					quizId: { _id: 'quiz123' },
					studentId: 'student123',
					score: 85,
					answers: [
						{ questionId: null, selectedAnswer: 'invalid', isCorrect: 'yes' },
						'not an object',
						null,
						undefined,
					],
				};

				QuizAttempt.findById = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnValue({
						populate: jest.fn().mockResolvedValue(mockAttempt),
					}),
				});

				await quizAttemptController.getAttemptById(req, res);

				// Backend doesn't validate answer structure
				expect(res.json).toHaveBeenCalledWith(mockAttempt);
			});

			// Description: supports concurrent reads of the same attempt resource
			test('should handle concurrent access to same attempt', async () => {
				req.params = { attemptId: 'attempt123' };

				const mockAttempt = {
					_id: 'attempt123',
					quizId: { _id: 'quiz123' },
					studentId: 'student123',
					score: 85,
				};

				QuizAttempt.findById = jest.fn().mockReturnValue({
					populate: jest.fn().mockReturnValue({
						populate: jest.fn().mockResolvedValue(mockAttempt),
					}),
				});

				// Simulate concurrent requests
				await Promise.all([
					quizAttemptController.getAttemptById(req, res),
					quizAttemptController.getAttemptById(req, res),
					quizAttemptController.getAttemptById(req, res),
				]);

				expect(res.json).toHaveBeenCalledTimes(3);
			});
		});
	});
});
