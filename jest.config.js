/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  coverageDirectory: "<rootDir>/coverage",
  collectCoverageFrom: [
    "<rootDir>/src/**/*.ts",
  ],
  coverageReporters: ["json", "html"],
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  // transform: {
  //   "^.+\.tsx?$": ["ts-jest", {}],
  // },
};