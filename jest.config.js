module.exports = {
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*\\.test)\\.tsx?$',
  modulePathIgnorePatterns: ['/build/'],

  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverage: true,
};
