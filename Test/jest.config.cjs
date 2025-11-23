module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>/__tests__'],
    moduleNameMapper: {
        '^multer$': '<rootDir>/node_modules/multer',
        '^@google/generative-ai$': '<rootDir>/node_modules/@google/generative-ai',
        '^mongoose$': '<rootDir>/node_modules/mongoose',
        '^jsonwebtoken$': '<rootDir>/node_modules/jsonwebtoken',
        '^bcryptjs$': '<rootDir>/node_modules/bcryptjs'
    },
};
